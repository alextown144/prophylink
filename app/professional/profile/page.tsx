import { requireUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { ProfessionalOnboardingForm } from "@/components/onboarding/professional-onboarding-form";

export default async function ProfessionalProfilePage() {
  await requireUser();

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
      <ProfessionalOnboardingForm />
    </main>
  );
}
