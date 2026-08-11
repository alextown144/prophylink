"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfessionalOnboarding } from "@/app/onboarding/actions";
import { launchProfessionalRoles, tricities } from "@/lib/product/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfessionalOnboardingDefaults = {
  firstName?: string | null;
  lastName?: string | null;
  professionalRole?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  hourlyRate?: string | number | null;
  yearsExperience?: string | number | null;
  preferredRadius?: string | number | null;
  shortBio?: string | null;
};

export function ProfessionalOnboardingForm({
  defaults
}: {
  defaults?: ProfessionalOnboardingDefaults;
}) {
  const [state, formAction] = useActionState(
    saveProfessionalOnboarding,
    { ok: false, message: "" }
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Professional onboarding</CardTitle>
        <CardDescription>
          Milestone 2 captures the profile foundation. Credentials and availability
          are separate milestone workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              defaultValue={defaults?.firstName}
              id="first_name"
              label="First name"
              placeholder="Sarah"
            />
            <Field
              defaultValue={defaults?.lastName}
              id="last_name"
              label="Last name"
              placeholder="Martinez"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="professional_role">Professional role</Label>
            <select
              className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
              defaultValue={defaults?.professionalRole ?? undefined}
              id="professional_role"
              name="professional_role"
            >
              {launchProfessionalRoles.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <select
                className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
                defaultValue={defaults?.city ?? undefined}
                id="city"
                name="city"
              >
                {tricities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <Field defaultValue={defaults?.state} id="state" label="State" placeholder="WA" />
            <Field
              defaultValue={defaults?.postalCode}
              id="postal_code"
              label="ZIP code"
              placeholder="99352"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              defaultValue={defaults?.hourlyRate}
              id="hourly_rate"
              label="Typical hourly rate"
              placeholder="$72"
            />
            <Field
              defaultValue={defaults?.yearsExperience}
              id="years_experience"
              label="Years experience"
              placeholder="8"
            />
            <Field
              defaultValue={defaults?.preferredRadius}
              id="preferred_radius"
              label="Preferred radius"
              placeholder="25 miles"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="short_bio">Short bio</Label>
            <textarea
              className="focus-ring min-h-28 rounded-lg border bg-white px-3 py-2 text-sm"
              defaultValue={defaults?.shortBio ?? undefined}
              id="short_bio"
              name="short_bio"
              placeholder="A short, marketplace-safe summary of your experience."
            />
          </div>
          {state.message ? (
            <p
              className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
              role="status"
            >
              {state.message}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving..." : "Save professional foundation"}
    </Button>
  );
}

function Field({
  defaultValue,
  id,
  label,
  placeholder
}: {
  defaultValue?: string | number | null;
  id: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        defaultValue={defaultValue ?? undefined}
        id={id}
        name={id}
        placeholder={placeholder}
      />
    </div>
  );
}
