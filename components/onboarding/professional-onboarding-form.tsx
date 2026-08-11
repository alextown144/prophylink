"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfessionalOnboarding } from "@/app/onboarding/actions";
import { launchProfessionalRoles, tricities } from "@/lib/product/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfessionalOnboardingForm() {
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
            <Field id="first_name" label="First name" placeholder="Sarah" />
            <Field id="last_name" label="Last name" placeholder="Martinez" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="professional_role">Professional role</Label>
            <select
              className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
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
            <Field id="state" label="State" placeholder="WA" />
            <Field id="postal_code" label="ZIP code" placeholder="99352" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="hourly_rate" label="Typical hourly rate" placeholder="$72" />
            <Field id="years_experience" label="Years experience" placeholder="8" />
            <Field id="preferred_radius" label="Preferred radius" placeholder="25 miles" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="short_bio">Short bio</Label>
            <textarea
              className="focus-ring min-h-28 rounded-lg border bg-white px-3 py-2 text-sm"
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
  id,
  label,
  placeholder
}: {
  id: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} />
    </div>
  );
}
