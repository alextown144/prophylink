"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveOfficeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OfficeOnboardingDefaults = {
  practiceName?: string | null;
  primaryContact?: string | null;
  contactEmail?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  website?: string | null;
  softwareUsed?: string | null;
};

export function OfficeOnboardingForm({
  defaults
}: {
  defaults?: OfficeOnboardingDefaults;
}) {
  const [state, formAction] = useActionState(
    saveOfficeOnboarding,
    { ok: false, message: "" }
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Office onboarding</CardTitle>
        <CardDescription>
          Create the organization and first location. Additional locations and
          subscription gates remain configurable later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <Field
            defaultValue={defaults?.practiceName}
            id="practice_name"
            label="Practice name"
            placeholder="Richland Family Dental"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              defaultValue={defaults?.primaryContact}
              id="primary_contact"
              label="Primary contact"
              placeholder="Avery Chen"
            />
            <Field
              defaultValue={defaults?.contactEmail}
              id="contact_email"
              label="Contact email"
              placeholder="office@example.com"
            />
          </div>
          <Field
            defaultValue={defaults?.addressLine1}
            id="address_line1"
            label="Address"
            placeholder="123 Columbia Center Blvd"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field defaultValue={defaults?.city} id="city" label="City" placeholder="Richland" />
            <Field defaultValue={defaults?.state} id="state" label="State" placeholder="WA" />
            <Field
              defaultValue={defaults?.postalCode}
              id="postal_code"
              label="ZIP code"
              placeholder="99352"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              defaultValue={defaults?.phone}
              id="phone"
              label="Office phone"
              placeholder="(509) 555-0134"
            />
            <Field
              defaultValue={defaults?.website}
              id="website"
              label="Website"
              placeholder="https://example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="software_used">Practice software</Label>
            <Input
              defaultValue={defaults?.softwareUsed ?? undefined}
              id="software_used"
              name="software_used"
              placeholder="Dentrix, Eaglesoft, Open Dental"
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
      {pending ? "Saving..." : "Save office foundation"}
    </Button>
  );
}

function Field({
  defaultValue,
  id,
  label,
  placeholder
}: {
  defaultValue?: string | null;
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
