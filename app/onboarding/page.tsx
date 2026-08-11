import { BriefcaseBusiness, Stethoscope } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { AccountTypeCard } from "@/components/onboarding/account-type-card";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
          Account setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Choose your ProphyLink workspace
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Milestone 2 separates professional and dental office onboarding so each
          account starts with the right profile foundation.
        </p>
      </div>
      <section className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
        <AccountTypeCard
          description="Set your launch role, location, rate, and basic marketplace profile."
          href="/onboarding/professional"
          icon={Stethoscope}
          title="Dental professional"
        />
        <AccountTypeCard
          description="Create your practice organization and first office location."
          href="/onboarding/office"
          icon={BriefcaseBusiness}
          title="Dental office"
        />
      </section>
    </main>
  );
}
