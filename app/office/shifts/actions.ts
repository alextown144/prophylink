"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  availabilityRuleCoversShift,
  availabilityRuleOverlapsShift
} from "@/lib/availability";
import { blockingBookingStatuses } from "@/lib/booking-conflicts";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createNotificationForUser } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { organizationHasCapability } from "@/lib/subscription-gates";
import type { Database } from "@/lib/supabase/database.types";
import {
  availableProfessionalSelectionSchema,
  bookingSelectionSchema,
  dollarsToCents,
  officeBookingLifecycleSchema,
  shiftPostingSchema,
  shiftUpdateSchema
} from "@/lib/validation/account";

export type OfficeShiftActionResult = {
  ok: boolean;
  message: string;
};

type OrganizationMembership = {
  organization_id: string;
};

type BookingEventInsert = Database["public"]["Tables"]["booking_events"]["Insert"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];
type ShiftUpdate = Database["public"]["Tables"]["shifts"]["Update"];

type BookingSelection = {
  id: string;
  shift_id: string | null;
  organization_id: string;
  professional_profile_id: string;
  agreed_starts_at: string;
  agreed_ends_at: string;
  status:
    | "invited"
    | "interested"
    | "requested"
    | "pending_office_approval"
    | "accepted"
    | "confirmed"
    | "declined"
    | "cancelled"
    | "completed";
};

type ProfessionalUserRef = {
  user_id: string;
};

type ShiftForProfessionalSelection = {
  id: string;
  organization_id: string;
  office_location_id: string;
  professional_role_id: string;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
};

type ProfessionalForSelection = {
  id: string;
  user_id: string;
  professional_role_id: string;
  hourly_rate_cents: number | null;
};

type AvailabilityRuleForSelection =
  Database["public"]["Tables"]["availability_rules"]["Row"];

const timezone = "America/Los_Angeles";
const editableShiftStatuses = new Set(["draft", "open"]);

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function postOfficeShift(
  _previousState: OfficeShiftActionResult,
  formData: FormData
): Promise<OfficeShiftActionResult> {
  const user = await requireUser();
  const parsed = shiftPostingSchema.safeParse(getShiftFormInput(formData));

  if (!parsed.success) {
    return { ok: false, message: "Check the shift details and time range." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  if (!organizationMembership?.organization_id) {
    return { ok: false, message: "Complete your office setup before posting shifts." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, message: "Server configuration is required before subscription gates can be checked." };
  }

  const admin = createSupabaseAdminClient();
  const canPostShifts = await organizationHasCapability(
    admin,
    organizationMembership.organization_id,
    "post_shifts"
  );

  if (!canPostShifts) {
    return { ok: false, message: "Your current office plan does not include shift posting." };
  }

  const shift = parsed.data;
  const [locationResult, roleResult] = await Promise.all([
    supabase
      .from("office_locations")
      .select("id")
      .eq("id", shift.officeLocationId)
      .eq("organization_id", organizationMembership.organization_id)
      .maybeSingle(),
    supabase
      .from("professional_roles")
      .select("id")
      .eq("id", shift.professionalRoleId)
      .eq("enabled", true)
      .maybeSingle()
  ]);

  if (!locationResult.data) {
    return { ok: false, message: "Choose one of your saved office locations." };
  }

  if (!roleResult.data) {
    return { ok: false, message: "Choose an available professional role." };
  }

  const payload: ShiftInsert = {
    organization_id: organizationMembership.organization_id,
    office_location_id: shift.officeLocationId,
    professional_role_id: shift.professionalRoleId,
    created_by: user.id,
    status: shift.status,
    starts_at: localPacificDateTimeToIso(shift.date, shift.startTime),
    ends_at: localPacificDateTimeToIso(shift.date, shift.endTime),
    timezone,
    hourly_rate_cents: dollarsToCents(shift.hourlyRate),
    unpaid_lunch_minutes: shift.unpaidLunchMinutes ?? null,
    description: shift.description || null,
    required_notes: shift.requiredNotes || null,
    dress_requirements: shift.dressRequirements || null,
    parking_instructions: shift.parkingInstructions || null,
    arrival_instructions: shift.arrivalInstructions || null
  };

  const { error } = await supabase.from("shifts").insert([payload] as never[]);

  if (error) {
    return { ok: false, message: "Shift could not be posted." };
  }

  revalidatePath("/office/dashboard");
  revalidatePath("/office/shifts/new");
  redirect("/office/dashboard");
}

export async function updateOfficeShift(
  _previousState: OfficeShiftActionResult,
  formData: FormData
): Promise<OfficeShiftActionResult> {
  const user = await requireUser();
  const parsed = shiftUpdateSchema.safeParse({
    ...getShiftFormInput(formData),
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the shift details and time range." };
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = await getCurrentOrganizationId(supabase, user.id);

  if (!organizationId) {
    return { ok: false, message: "Complete your office setup before editing shifts." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, message: "Server configuration is required before subscription gates can be checked." };
  }

  const admin = createSupabaseAdminClient();
  const canPostShifts = await organizationHasCapability(admin, organizationId, "post_shifts");

  if (!canPostShifts) {
    return { ok: false, message: "Your current office plan does not include shift posting." };
  }

  const shift = parsed.data;
  const [existingShiftResult, locationResult, roleResult] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, status")
      .eq("id", shift.shiftId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("office_locations")
      .select("id")
      .eq("id", shift.officeLocationId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("professional_roles")
      .select("id")
      .eq("id", shift.professionalRoleId)
      .eq("enabled", true)
      .maybeSingle()
  ]);

  if (!existingShiftResult.data) {
    return { ok: false, message: "Shift was not found for this office." };
  }

  const existingShift = existingShiftResult.data as {
    id: string;
    status: string;
  };

  if (!editableShiftStatuses.has(existingShift.status)) {
    return { ok: false, message: "Only draft or open shifts can be edited." };
  }

  if (!locationResult.data) {
    return { ok: false, message: "Choose one of your saved office locations." };
  }

  if (!roleResult.data) {
    return { ok: false, message: "Choose an available professional role." };
  }

  const payload: ShiftUpdate = {
    office_location_id: shift.officeLocationId,
    professional_role_id: shift.professionalRoleId,
    status: shift.status,
    starts_at: localPacificDateTimeToIso(shift.date, shift.startTime),
    ends_at: localPacificDateTimeToIso(shift.date, shift.endTime),
    timezone,
    hourly_rate_cents: dollarsToCents(shift.hourlyRate),
    unpaid_lunch_minutes: shift.unpaidLunchMinutes ?? null,
    description: shift.description || null,
    required_notes: shift.requiredNotes || null,
    dress_requirements: shift.dressRequirements || null,
    parking_instructions: shift.parkingInstructions || null,
    arrival_instructions: shift.arrivalInstructions || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("shifts")
    .update(payload as never)
    .eq("id", shift.shiftId)
    .eq("organization_id", organizationId);

  if (error) {
    return { ok: false, message: "Shift could not be updated." };
  }

  revalidatePath("/office/dashboard");
  revalidatePath(`/office/shifts/${shift.shiftId}`);
  revalidatePath(`/office/shifts/${shift.shiftId}/edit`);
  revalidatePath("/professional/shifts");
  redirect(`/office/shifts/${shift.shiftId}?updated=1`);
}

export async function acceptInterestedProfessional(formData: FormData) {
  const user = await requireUser();
  const parsed = bookingSelectionSchema.safeParse({
    bookingId: formString(formData, "booking_id"),
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    redirect("/office/dashboard");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=service_required`);
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = await getCurrentOrganizationId(supabase, user.id);

  if (!organizationId) {
    redirect("/office/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const canRequestProfessionals = await organizationHasCapability(
    admin,
    organizationId,
    "request_professionals"
  );

  if (!canRequestProfessionals) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=plan_required`);
  }

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, shift_id, organization_id, professional_profile_id, agreed_starts_at, agreed_ends_at, status"
    )
    .eq("id", parsed.data.bookingId)
    .eq("shift_id", parsed.data.shiftId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const booking = data as BookingSelection | null;

  if (!booking || booking.status !== "interested") {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=unavailable`);
  }

  const now = new Date().toISOString();
  const hasConflict = await professionalHasBlockingConflict(admin, {
    endsAt: booking.agreed_ends_at,
    excludeBookingId: booking.id,
    professionalProfileId: booking.professional_profile_id,
    startsAt: booking.agreed_starts_at
  });

  if (hasConflict) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=conflict`);
  }

  const { error } = await admin
    .from("bookings")
    .update({
      status: "accepted",
      updated_at: now
    } as never)
    .eq("id", booking.id);

  if (error) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=failed`);
  }

  await admin
    .from("bookings")
    .update({
      status: "declined",
      updated_at: now
    } as never)
    .eq("shift_id", parsed.data.shiftId)
    .eq("organization_id", organizationId)
    .eq("status", "interested")
    .neq("id", booking.id);

  await admin
    .from("shifts")
    .update({
      status: "pending",
      updated_at: now
    } as never)
    .eq("id", parsed.data.shiftId)
    .eq("organization_id", organizationId);

  const eventPayload: BookingEventInsert = {
    booking_id: booking.id,
    actor_user_id: user.id,
    event_type: "office_accepted_professional",
    metadata: { shift_id: parsed.data.shiftId }
  };
  const { data: professionalData } = await admin
    .from("professional_profiles")
    .select("user_id")
    .eq("id", booking.professional_profile_id)
    .maybeSingle();
  const professional = professionalData as ProfessionalUserRef | null;

  await Promise.all([
    admin.from("booking_events").insert([eventPayload] as never[]),
    professional?.user_id
      ? createNotificationForUser(admin, professional.user_id, {
          body: "An office accepted your interest. Confirm or decline the shift from your shift responses.",
          metadata: { booking_id: booking.id, shift_id: parsed.data.shiftId },
          title: "Your shift interest was accepted",
          type: "shift_accepted"
        })
      : Promise.resolve()
  ]);

  revalidatePath("/office/dashboard");
  revalidatePath(`/office/shifts/${parsed.data.shiftId}`);
  revalidatePath("/notifications");
  revalidatePath("/professional/shifts");
  revalidatePath("/professional/dashboard");
  redirect(`/office/shifts/${parsed.data.shiftId}?selection=accepted`);
}

export async function selectAvailableProfessional(formData: FormData) {
  const user = await requireUser();
  const parsed = availableProfessionalSelectionSchema.safeParse({
    professionalProfileId: formString(formData, "professional_profile_id"),
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    redirect("/office/dashboard");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=service_required`);
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = await getCurrentOrganizationId(supabase, user.id);

  if (!organizationId) {
    redirect("/office/dashboard");
  }

  const { data: shiftData } = await supabase
    .from("shifts")
    .select(
      "id, organization_id, office_location_id, professional_role_id, status, starts_at, ends_at, hourly_rate_cents"
    )
    .eq("id", parsed.data.shiftId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const shift = shiftData as ShiftForProfessionalSelection | null;

  if (!shift || shift.status !== "open") {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=unavailable`);
  }

  const admin = createSupabaseAdminClient();
  const canRequestProfessionals = await organizationHasCapability(
    admin,
    organizationId,
    "request_professionals"
  );

  if (!canRequestProfessionals) {
    redirect(`/office/shifts/${parsed.data.shiftId}?selection=plan_required`);
  }

  const [{ data: professionalData }, { data: existingBookingData }, { data: availabilityData }] =
    await Promise.all([
      admin
        .from("professional_profiles")
        .select("id, user_id, professional_role_id, hourly_rate_cents")
        .eq("id", parsed.data.professionalProfileId)
        .maybeSingle(),
      admin
        .from("bookings")
        .select("id, status")
        .eq("shift_id", shift.id)
        .eq("professional_profile_id", parsed.data.professionalProfileId)
        .maybeSingle(),
      admin
        .from("availability_rules")
        .select(
          "id, professional_profile_id, kind, starts_at, ends_at, all_day, recurrence_rule, recurrence_starts_on, recurrence_ends_on, timezone, notes, created_at, updated_at"
        )
        .eq("professional_profile_id", parsed.data.professionalProfileId)
    ]);
  const professional = professionalData as ProfessionalForSelection | null;

  if (!professional || professional.professional_role_id !== shift.professional_role_id) {
    redirect(`/office/shifts/${shift.id}?selection=unavailable`);
  }

  if (existingBookingData) {
    redirect(`/office/shifts/${shift.id}?selection=already_selected`);
  }

  const availabilityRules = (availabilityData ?? []) as AvailabilityRuleForSelection[];
  const hasBookingConflict = await professionalHasBlockingConflict(admin, {
    endsAt: shift.ends_at,
    professionalProfileId: professional.id,
    startsAt: shift.starts_at
  });
  const hasAvailableWindow = availabilityRules
    .filter((rule) => rule.kind === "available")
    .some((rule) => availabilityRuleCoversShift(rule, shift.starts_at, shift.ends_at));
  const hasUnavailableConflict = availabilityRules
    .filter((rule) => rule.kind === "unavailable")
    .some((rule) => availabilityRuleOverlapsShift(rule, shift.starts_at, shift.ends_at));

  if (hasBookingConflict) {
    redirect(`/office/shifts/${shift.id}?selection=conflict`);
  }

  if (!hasAvailableWindow || hasUnavailableConflict) {
    redirect(`/office/shifts/${shift.id}?selection=no_availability`);
  }

  const now = new Date().toISOString();
  const bookingPayload: BookingInsert = {
    agreed_ends_at: shift.ends_at,
    agreed_hourly_rate_cents: shift.hourly_rate_cents ?? professional.hourly_rate_cents,
    agreed_starts_at: shift.starts_at,
    office_location_id: shift.office_location_id,
    organization_id: organizationId,
    professional_profile_id: professional.id,
    shift_id: shift.id,
    status: "accepted"
  };
  const { data: bookingData, error } = await admin
    .from("bookings")
    .insert([bookingPayload] as never[])
    .select("id")
    .single();

  if (error || !bookingData) {
    redirect(`/office/shifts/${shift.id}?selection=failed`);
  }

  const booking = bookingData as { id: string };

  await admin
    .from("bookings")
    .update({
      status: "declined",
      updated_at: now
    } as never)
    .eq("shift_id", shift.id)
    .eq("organization_id", organizationId)
    .in("status", ["interested", "invited", "requested", "pending_office_approval"]);

  await admin
    .from("shifts")
    .update({
      status: "pending",
      updated_at: now
    } as never)
    .eq("id", shift.id)
    .eq("organization_id", organizationId);

  const eventPayload: BookingEventInsert = {
    actor_user_id: user.id,
    booking_id: booking.id,
    event_type: "office_selected_available_professional",
    metadata: { shift_id: shift.id }
  };
  await Promise.all([
    admin.from("booking_events").insert([eventPayload] as never[]),
    createNotificationForUser(admin, professional.user_id, {
      body: "An office selected you for a shift. Confirm or decline it from your shift responses.",
      metadata: { booking_id: booking.id, shift_id: shift.id },
      title: "You were selected for a shift",
      type: "shift_selected"
    })
  ]);

  revalidatePath("/office/dashboard");
  revalidatePath(`/office/shifts/${shift.id}`);
  revalidatePath("/notifications");
  revalidatePath("/professional/shifts");
  revalidatePath("/professional/dashboard");
  redirect(`/office/shifts/${shift.id}?selection=selected`);
}

export async function updateBookedShiftLifecycle(formData: FormData) {
  const user = await requireUser();
  const parsed = officeBookingLifecycleSchema.safeParse({
    action: formString(formData, "action"),
    bookingId: formString(formData, "booking_id"),
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    redirect("/office/dashboard");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect(`/office/shifts/${parsed.data.shiftId}?lifecycle=service_required`);
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = await getCurrentOrganizationId(supabase, user.id);

  if (!organizationId) {
    redirect("/office/dashboard");
  }

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, shift_id, organization_id, professional_profile_id, agreed_starts_at, agreed_ends_at, status"
    )
    .eq("id", parsed.data.bookingId)
    .eq("shift_id", parsed.data.shiftId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const booking = data as BookingSelection | null;
  const completes = parsed.data.action === "complete";

  if (
    !booking ||
    (completes && booking.status !== "confirmed") ||
    (!completes && !["accepted", "confirmed"].includes(booking.status))
  ) {
    redirect(`/office/shifts/${parsed.data.shiftId}?lifecycle=unavailable`);
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const bookingUpdate = completes
    ? {
        completed_at: now,
        status: "completed",
        updated_at: now
      }
    : {
        cancelled_reason: "Cancelled by office",
        status: "cancelled",
        updated_at: now
      };
  const shiftUpdate = {
    status: completes ? "completed" : "cancelled",
    updated_at: now
  };

  const { error } = await admin
    .from("bookings")
    .update(bookingUpdate as never)
    .eq("id", booking.id);

  if (error) {
    redirect(`/office/shifts/${parsed.data.shiftId}?lifecycle=failed`);
  }

  await admin
    .from("shifts")
    .update(shiftUpdate as never)
    .eq("id", parsed.data.shiftId)
    .eq("organization_id", organizationId);

  const eventPayload: BookingEventInsert = {
    booking_id: booking.id,
    actor_user_id: user.id,
    event_type: completes ? "office_completed_shift" : "office_cancelled_shift",
    metadata: { shift_id: parsed.data.shiftId }
  };
  const { data: professionalData } = await admin
    .from("professional_profiles")
    .select("user_id")
    .eq("id", booking.professional_profile_id)
    .maybeSingle();
  const professional = professionalData as ProfessionalUserRef | null;

  await Promise.all([
    admin.from("booking_events").insert([eventPayload] as never[]),
    professional?.user_id
      ? createNotificationForUser(admin, professional.user_id, {
          body: completes
            ? "Your office marked this shift completed."
            : "Your office cancelled this shift.",
          metadata: { booking_id: booking.id, shift_id: parsed.data.shiftId },
          title: completes ? "Shift marked completed" : "Shift cancelled",
          type: completes ? "shift_completed" : "shift_cancelled"
        })
      : Promise.resolve()
  ]);

  revalidatePath("/office/dashboard");
  revalidatePath(`/office/shifts/${parsed.data.shiftId}`);
  revalidatePath("/notifications");
  revalidatePath("/professional/shifts");
  revalidatePath("/professional/dashboard");
  redirect(
    `/office/shifts/${parsed.data.shiftId}?lifecycle=${completes ? "completed" : "cancelled"}`
  );
}

function getShiftFormInput(formData: FormData) {
  return {
    officeLocationId: formString(formData, "office_location_id"),
    professionalRoleId: formString(formData, "professional_role_id"),
    status: formString(formData, "status") || "open",
    date: formString(formData, "date"),
    startTime: formString(formData, "start_time"),
    endTime: formString(formData, "end_time"),
    hourlyRate: formString(formData, "hourly_rate").replace("$", ""),
    unpaidLunchMinutes: formString(formData, "unpaid_lunch_minutes"),
    description: formString(formData, "description"),
    requiredNotes: formString(formData, "required_notes"),
    dressRequirements: formString(formData, "dress_requirements"),
    parkingInstructions: formString(formData, "parking_instructions"),
    arrivalInstructions: formString(formData, "arrival_instructions")
  };
}

async function getCurrentOrganizationId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  return organizationMembership?.organization_id ?? null;
}

async function professionalHasBlockingConflict(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  {
    endsAt,
    excludeBookingId,
    professionalProfileId,
    startsAt
  }: {
    endsAt: string;
    excludeBookingId?: string;
    professionalProfileId: string;
    startsAt: string;
  }
) {
  let query = admin
    .from("bookings")
    .select("id")
    .eq("professional_profile_id", professionalProfileId)
    .in("status", [...blockingBookingStatuses])
    .lt("agreed_starts_at", endsAt)
    .gt("agreed_ends_at", startsAt)
    .limit(1);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data } = await query.maybeSingle();

  return Boolean(data);
}

function localPacificDateTimeToIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timezone);

  return new Date(utcGuess - offset).toISOString();
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedTimeAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
    Number(values.second)
  );

  return zonedTimeAsUtc - date.getTime();
}
