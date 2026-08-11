"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { dollarsToCents, shiftPostingSchema } from "@/lib/validation/account";

type ActionResult = {
  ok: boolean;
  message: string;
};

type OrganizationMembership = {
  organization_id: string;
};

type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];

const timezone = "America/Los_Angeles";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function postOfficeShift(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = shiftPostingSchema.safeParse({
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
  });

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
