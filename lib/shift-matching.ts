import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  availabilityRuleCoversShift,
  availabilityRuleOverlapsShift,
  formatTimeRange,
  parseWeeklyRecurrenceDays,
  type AvailabilityWindowRule
} from "@/lib/availability";
import { blockingBookingStatuses } from "@/lib/booking-conflicts";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export type ShiftForAvailabilityMatching = {
  id: string;
  professional_role_id: string;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
};

export type AvailableProfessionalMatch = {
  id: string;
  availabilityLabel: string;
  city: string | null;
  displayName: string;
  email: string;
  existingBookingStatus: Database["public"]["Enums"]["booking_status"] | null;
  hourlyRateCents: number | null;
  preferredRadiusMiles: number | string | null;
  roleName: string | null;
  shortBio: string | null;
  state: string | null;
  userId: string;
  yearsExperience: number | string | null;
};

type CandidateProfile = {
  id: string;
  user_id: string;
  professional_role_id: string;
  hourly_rate_cents: number | null;
  preferred_radius_miles: number | string | null;
  short_bio: string | null;
  years_experience: number | string | null;
  user_profiles: {
    display_name: string | null;
    email: string;
    city: string | null;
    state: string | null;
  } | null;
  professional_roles: {
    name: string;
  } | null;
};

type CandidateBooking = {
  professional_profile_id: string;
  status: Database["public"]["Enums"]["booking_status"];
};

type CandidateBlockingBooking = {
  professional_profile_id: string;
};

type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];

export async function getAvailableProfessionalsForShift(
  admin: AdminClient,
  shift: ShiftForAvailabilityMatching,
  limit = 12
) {
  if (shift.status !== "open") {
    return [];
  }

  const { data: profileData } = await admin
    .from("professional_profiles")
    .select(
      "id, user_id, professional_role_id, hourly_rate_cents, preferred_radius_miles, short_bio, years_experience, user_profiles(display_name, email, city, state), professional_roles(name)"
    )
    .eq("professional_role_id", shift.professional_role_id)
    .eq("profile_visibility", "marketplace")
    .limit(Math.max(limit * 3, 30));
  const profiles = (profileData ?? []) as CandidateProfile[];
  const profileIds = profiles.map((profile) => profile.id);

  if (profileIds.length === 0) {
    return [];
  }

  const [availabilityResult, bookingsResult, blockingBookingsResult] = await Promise.all([
    admin
      .from("availability_rules")
      .select(
        "id, professional_profile_id, kind, starts_at, ends_at, all_day, recurrence_rule, recurrence_starts_on, recurrence_ends_on, timezone, notes, created_at, updated_at"
      )
      .in("professional_profile_id", profileIds),
    admin
      .from("bookings")
      .select("professional_profile_id, status")
      .eq("shift_id", shift.id)
      .in("professional_profile_id", profileIds),
    admin
      .from("bookings")
      .select("professional_profile_id")
      .in("professional_profile_id", profileIds)
      .in("status", [...blockingBookingStatuses])
      .lt("agreed_starts_at", shift.ends_at)
      .gt("agreed_ends_at", shift.starts_at)
  ]);
  const rulesByProfileId = new Map<string, AvailabilityRule[]>();
  const bookingStatusByProfileId = new Map<string, CandidateBooking["status"]>();
  const conflictingProfileIds = new Set(
    ((blockingBookingsResult.data ?? []) as CandidateBlockingBooking[]).map(
      (booking) => booking.professional_profile_id
    )
  );

  ((availabilityResult.data ?? []) as AvailabilityRule[]).forEach((rule) => {
    rulesByProfileId.set(rule.professional_profile_id, [
      ...(rulesByProfileId.get(rule.professional_profile_id) ?? []),
      rule
    ]);
  });
  ((bookingsResult.data ?? []) as CandidateBooking[]).forEach((booking) => {
    bookingStatusByProfileId.set(booking.professional_profile_id, booking.status);
  });

  return profiles
    .map((profile) => {
      const rules = rulesByProfileId.get(profile.id) ?? [];
      const matchingRule = rules
        .filter((rule) => rule.kind === "available")
        .find((rule) => availabilityRuleCoversShift(rule, shift.starts_at, shift.ends_at));
      const hasUnavailableConflict = rules
        .filter((rule) => rule.kind === "unavailable")
        .some((rule) => availabilityRuleOverlapsShift(rule, shift.starts_at, shift.ends_at));

      if (!matchingRule || hasUnavailableConflict || conflictingProfileIds.has(profile.id)) {
        return null;
      }

      return {
        availabilityLabel: formatAvailabilityLabel(matchingRule),
        city: profile.user_profiles?.city ?? null,
        displayName:
          profile.user_profiles?.display_name ??
          profile.user_profiles?.email ??
          "Professional",
        email: profile.user_profiles?.email ?? "Email not saved",
        existingBookingStatus: bookingStatusByProfileId.get(profile.id) ?? null,
        hourlyRateCents: profile.hourly_rate_cents,
        id: profile.id,
        preferredRadiusMiles: profile.preferred_radius_miles,
        roleName: profile.professional_roles?.name ?? null,
        shortBio: profile.short_bio,
        state: profile.user_profiles?.state ?? null,
        userId: profile.user_id,
        yearsExperience: profile.years_experience
      };
    })
    .filter((profile): profile is AvailableProfessionalMatch => Boolean(profile))
    .slice(0, limit);
}

function formatAvailabilityLabel(rule: AvailabilityWindowRule) {
  const recurringDays = parseWeeklyRecurrenceDays(rule.recurrence_rule);
  const window = formatTimeRange(rule.starts_at, rule.ends_at);

  return recurringDays.length > 0 ? `${recurringDays.join(", ")} ${window}` : window;
}
