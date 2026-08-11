import { requireUser } from "@/lib/auth/session";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";

export default async function ProfessionalOnboardingPage() {
  await requireUser();

  return (
    <main className="container max-w-4xl py-10">
      <ProfessionalOnboardingForm />
    </main>
  );
}
