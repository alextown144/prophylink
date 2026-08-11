"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { buildWeeklyRecurrenceRule, todayIsoDate } from "@/lib/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ActionResult = {
  ok: boolean;
  message: string;
};

type AvailabilityRuleInsert = Database["public"]["Tables"]["availability_rules"]["Insert"];
type ProfessionalProfileRef = {
  id: string;
};

const timezone = "America/Los_Angeles";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim());
}

function localDateTimeToPacificIso(date: string, time: string) {
  return `${date}T${time}:00-07:00`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidTimeRange(startTime: string, endTime: string) {
  return /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)
    ? timeToMinutes(endTime) > timeToMinutes(startTime)
    : false;
}

export async function saveAvailabilityRule(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: professionalProfile } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const professionalProfileRef = professionalProfile as ProfessionalProfileRef | null;

  if (!professionalProfileRef) {
    return {
      ok: false,
      message: "Complete your professional profile before adding availability."
    };
  }

  const mode = formString(formData, "mode");
  const kind = formString(formData, "kind");
  const startTime = formString(formData, "start_time");
  const endTime = formString(formData, "end_time");
  const notes = formString(formData, "notes") || null;

  if (kind !== "available" && kind !== "unavailable") {
    return { ok: false, message: "Choose available or unavailable." };
  }

  if (!isValidTimeRange(startTime, endTime)) {
    return { ok: false, message: "End time must be after start time." };
  }

  if (mode === "single") {
    const date = formString(formData, "date");

    if (!date) {
      return { ok: false, message: "Choose a date." };
    }

    const payload: AvailabilityRuleInsert = {
      professional_profile_id: professionalProfileRef.id,
      kind,
      starts_at: localDateTimeToPacificIso(date, startTime),
      ends_at: localDateTimeToPacificIso(date, endTime),
      all_day: false,
      notes,
      timezone
    };
    const { error } = await supabase.from("availability_rules").insert([payload] as never[]);

    if (error) {
      return { ok: false, message: "Availability could not be saved." };
    }

    revalidateAvailabilityPaths();
    return { ok: true, message: "Availability date saved." };
  }

  if (mode === "weekly") {
    const days = formStrings(formData, "weekdays");
    const recurrenceRule = buildWeeklyRecurrenceRule(days);
    const recurrenceStartsOn = formString(formData, "recurrence_starts_on") || todayIsoDate();
    const recurrenceEndsOn = formString(formData, "recurrence_ends_on") || null;

    if (!recurrenceRule) {
      return { ok: false, message: "Choose at least one weekday." };
    }

    if (recurrenceEndsOn && recurrenceEndsOn < recurrenceStartsOn) {
      return { ok: false, message: "Repeat end date must be after the start date." };
    }

    const payload: AvailabilityRuleInsert = {
      professional_profile_id: professionalProfileRef.id,
      kind,
      starts_at: localDateTimeToPacificIso(recurrenceStartsOn, startTime),
      ends_at: localDateTimeToPacificIso(recurrenceStartsOn, endTime),
      all_day: false,
      recurrence_rule: recurrenceRule,
      recurrence_starts_on: recurrenceStartsOn,
      recurrence_ends_on: recurrenceEndsOn,
      notes,
      timezone
    };
    const { error } = await supabase.from("availability_rules").insert([payload] as never[]);

    if (error) {
      return { ok: false, message: "Weekly availability could not be saved." };
    }

    revalidateAvailabilityPaths();
    return { ok: true, message: "Weekly availability saved." };
  }

  return { ok: false, message: "Choose an availability type." };
}

export async function deleteAvailabilityRule(formData: FormData) {
  await requireUser();
  const id = formString(formData, "id");

  if (!id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("availability_rules").delete().eq("id", id);
  revalidateAvailabilityPaths();
}

function revalidateAvailabilityPaths() {
  revalidatePath("/professional/availability");
  revalidatePath("/professional/dashboard");
}
