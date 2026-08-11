import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  ProfessionalOnboardingForm,
  type ProfessionalOnboardingDefaults
} from "@/components/onboarding/professional-onboarding-form";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type ProfessionalProfile = {
  professional_role_id: string;
  short_bio: string | null;
  years_experience: number | string | null;
  hourly_rate_cents: number | null;
  preferred_radius_miles: number | string | null;
};

type ProfessionalRoleLookup = {
  slug: string;
};

export default async function ProfessionalProfilePage() {
  const user = await requireUser();
  const defaults = await getProfessionalDefaults(user.id);

  return (
    <main className="container max-w-4xl py-10">
      <div className="mb-6">
        <Badge variant="secondary">Profile foundation</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Professional profile
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          Public-safe profile details for marketplace discovery. Credential upload
          and availability are intentionally deferred to Milestone 3.
        </p>
      </div>
      <ProfessionalOnboardingForm defaults={defaults} />
    </main>
  );
}

async function getProfessionalDefaults(userId: string): Promise<ProfessionalOnboardingDefaults> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, professionalProfileResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, last_name, city, state, postal_code")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("professional_profiles")
      .select(
        "professional_role_id, short_bio, years_experience, hourly_rate_cents, preferred_radius_miles"
      )
      .eq("user_id", userId)
      .maybeSingle()
  ]);
  const profile = profileResult.data as UserProfile | null;
  const professionalProfile = professionalProfileResult.data as ProfessionalProfile | null;
  let professionalRole: string | null = null;

  if (professionalProfile?.professional_role_id) {
    const { data } = await supabase
      .from("professional_roles")
      .select("slug")
      .eq("id", professionalProfile.professional_role_id)
      .maybeSingle();
    professionalRole = (data as ProfessionalRoleLookup | null)?.slug ?? null;
  }

  return {
    city: profile?.city,
    firstName: profile?.first_name,
    hourlyRate:
      typeof professionalProfile?.hourly_rate_cents === "number"
        ? professionalProfile.hourly_rate_cents / 100
        : null,
    lastName: profile?.last_name,
    postalCode: profile?.postal_code,
    preferredRadius: professionalProfile?.preferred_radius_miles,
    professionalRole,
    shortBio: professionalProfile?.short_bio,
    state: profile?.state,
    yearsExperience: professionalProfile?.years_experience
  };
}
