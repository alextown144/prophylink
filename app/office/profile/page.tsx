import { requireUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { OfficeOnboardingForm } from "@/components/onboarding/office-onboarding-form";

export default async function OfficeProfilePage() {
  await requireUser();

  return (
    <main className="container max-w-4xl py-10">
      <div className="mb-6">
        <Badge variant="secondary">Organization foundation</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Office profile
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          Practice and first-location details that future shift posting and
          professional search will use.
        </p>
      </div>
      <OfficeOnboardingForm />
    </main>
  );
}
