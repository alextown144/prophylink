import Link from "next/link";
import { AvailabilityRuleManager } from "@/components/professional/availability-rule-manager";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfessionalProfile = {
  id: string;
};

type AvailabilityRule = {
  id: string;
  kind: "available" | "unavailable";
  starts_at: string | null;
  ends_at: string | null;
  recurrence_rule: string | null;
  recurrence_starts_on: string | null;
  recurrence_ends_on: string | null;
  notes: string | null;
};

export default async function ProfessionalAvailabilityPage() {
  const user = await requireUser();
  const { professionalProfile, rules } = await getAvailabilityData(user.id);

  return (
    <main className="container py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <Badge variant="secondary">Availability MVP</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Availability calendar
          </h1>
          <p className="mt-2 leading-7 text-slate-600">
            Pick individual available or unavailable dates, or save repeating
            weekly rules like every Monday and Wednesday from 8 AM to 5 PM.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/professional/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      {professionalProfile ? (
        <AvailabilityRuleManager rules={rules} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-slate-950">
              Finish your professional profile first
            </p>
            <p className="mt-2 leading-7 text-slate-600">
              Availability is attached to your professional profile, so the
              profile foundation needs to exist before scheduling can be saved.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professional/profile">Complete profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

async function getAvailabilityData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: professionalProfileData } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const professionalProfile = professionalProfileData as ProfessionalProfile | null;

  if (!professionalProfile) {
    return {
      professionalProfile: null,
      rules: [] as AvailabilityRule[]
    };
  }

  const { data } = await supabase
    .from("availability_rules")
    .select(
      "id, kind, starts_at, ends_at, recurrence_rule, recurrence_starts_on, recurrence_ends_on, notes"
    )
    .eq("professional_profile_id", professionalProfile.id)
    .order("created_at", { ascending: false });

  return {
    professionalProfile,
    rules: (data ?? []) as AvailabilityRule[]
  };
}
