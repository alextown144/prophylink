"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  bookingResponseSchema,
  shiftInterestSchema
} from "@/lib/validation/account";

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingEventInsert = Database["public"]["Tables"]["booking_events"]["Insert"];

type ProfessionalProfileRef = {
  id: string;
};

type BookingRef = {
  id: string;
  shift_id: string | null;
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

type ShiftRef = {
  id: string;
  organization_id: string;
  office_location_id: string;
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function expressInterestInShift(formData: FormData) {
  const user = await requireUser();
  const parsed = shiftInterestSchema.safeParse({
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    redirect("/professional/shifts");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/professional/shifts?interest=service_required");
  }

  const supabase = await createSupabaseServerClient();
  const { data: professionalProfile } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const professionalProfileRef = professionalProfile as ProfessionalProfileRef | null;

  if (!professionalProfileRef) {
    redirect("/professional/shifts?interest=profile_required");
  }

  const { data: shiftData } = await supabase
    .from("shifts")
    .select("id, organization_id, office_location_id, starts_at, ends_at, hourly_rate_cents, status")
    .eq("id", parsed.data.shiftId)
    .eq("status", "open")
    .maybeSingle();

  const shift = shiftData as ShiftRef | null;

  if (!shift) {
    redirect("/professional/shifts?interest=unavailable");
  }

  const admin = createSupabaseAdminClient();
  const { data: existingBooking } = await admin
    .from("bookings")
    .select("id")
    .eq("shift_id", shift.id)
    .eq("professional_profile_id", professionalProfileRef.id)
    .limit(1)
    .maybeSingle();

  if (existingBooking) {
    redirect("/professional/shifts?interest=already_sent");
  }

  const bookingPayload: BookingInsert = {
    shift_id: shift.id,
    organization_id: shift.organization_id,
    office_location_id: shift.office_location_id,
    professional_profile_id: professionalProfileRef.id,
    status: "interested",
    agreed_hourly_rate_cents: shift.hourly_rate_cents,
    agreed_starts_at: shift.starts_at,
    agreed_ends_at: shift.ends_at
  };

  const { data: booking, error } = await admin
    .from("bookings")
    .insert([bookingPayload] as never[])
    .select("id")
    .single();

  if (error || !booking) {
    redirect("/professional/shifts?interest=failed");
  }

  const eventPayload: BookingEventInsert = {
    booking_id: booking.id,
    actor_user_id: user.id,
    event_type: "professional_interested",
    metadata: { shift_id: shift.id }
  };

  await admin.from("booking_events").insert([eventPayload] as never[]);

  revalidatePath("/professional/shifts");
  revalidatePath("/professional/dashboard");
  revalidatePath("/office/dashboard");
  redirect("/professional/shifts?interest=sent");
}

export async function respondToAcceptedShift(formData: FormData) {
  const user = await requireUser();
  const parsed = bookingResponseSchema.safeParse({
    action: formString(formData, "action"),
    bookingId: formString(formData, "booking_id"),
    shiftId: formString(formData, "shift_id")
  });

  if (!parsed.success) {
    redirect("/professional/shifts");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/professional/shifts?response=service_required");
  }

  const supabase = await createSupabaseServerClient();
  const { data: professionalProfile } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const professionalProfileRef = professionalProfile as ProfessionalProfileRef | null;

  if (!professionalProfileRef) {
    redirect("/professional/shifts?response=profile_required");
  }

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("id, shift_id, status")
    .eq("id", parsed.data.bookingId)
    .eq("shift_id", parsed.data.shiftId)
    .eq("professional_profile_id", professionalProfileRef.id)
    .maybeSingle();

  const booking = bookingData as BookingRef | null;

  if (!booking || booking.status !== "accepted") {
    redirect("/professional/shifts?response=unavailable");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const confirms = parsed.data.action === "confirm";
  const { error } = await admin
    .from("bookings")
    .update({
      confirmed_at: confirms ? now : null,
      status: confirms ? "confirmed" : "declined",
      updated_at: now
    } as never)
    .eq("id", booking.id);

  if (error) {
    redirect("/professional/shifts?response=failed");
  }

  await admin
    .from("shifts")
    .update({
      status: confirms ? "filled" : "open",
      updated_at: now
    } as never)
    .eq("id", parsed.data.shiftId);

  const eventPayload: BookingEventInsert = {
    booking_id: booking.id,
    actor_user_id: user.id,
    event_type: confirms ? "professional_confirmed_shift" : "professional_declined_shift",
    metadata: { shift_id: parsed.data.shiftId }
  };

  await admin.from("booking_events").insert([eventPayload] as never[]);

  revalidatePath("/professional/shifts");
  revalidatePath("/professional/dashboard");
  revalidatePath("/office/dashboard");
  revalidatePath(`/office/shifts/${parsed.data.shiftId}`);
  redirect(`/professional/shifts?response=${confirms ? "confirmed" : "declined"}`);
}
