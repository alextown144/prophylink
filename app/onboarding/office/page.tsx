import { requireUser } from "@/lib/auth/session";
import { OfficeOnboardingForm } from "@/components/onboarding/office-onboarding-form";

export default async function OfficeOnboardingPage() {
  await requireUser();

  return (
    <main className="container max-w-4xl py-10">
      <OfficeOnboardingForm />
    </main>
  );
}
