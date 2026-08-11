"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import { postOfficeShift } from "@/app/office/shifts/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ShiftLocationOption = {
  id: string;
  label: string;
};

export type ShiftRoleOption = {
  id: string;
  label: string;
};

export function ShiftPostingForm({
  locations,
  roles
}: {
  locations: ShiftLocationOption[];
  roles: ShiftRoleOption[];
}) {
  const [state, formAction] = useActionState(postOfficeShift, {
    ok: false,
    message: ""
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-teal-700" />
          Post a shift
        </CardTitle>
        <CardDescription>
          Create an open shift for professionals to review. Save as draft when the
          details are not ready yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField id="office_location_id" label="Office location">
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </SelectField>
            <SelectField id="professional_role_id" label="Professional needed">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field id="date" label="Date" type="date" />
            <Field id="start_time" label="Start" type="time" />
            <Field id="end_time" label="End" type="time" />
            <SelectField id="status" label="Status">
              <option value="open">Open shift</option>
              <option value="draft">Draft</option>
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="hourly_rate" label="Hourly rate" placeholder="$72" />
            <Field
              id="unpaid_lunch_minutes"
              label="Unpaid lunch minutes"
              placeholder="30"
              type="number"
            />
          </div>
          <TextAreaField
            id="description"
            label="Shift description"
            placeholder="Briefly describe the schedule, patient flow, and anything that helps a professional decide."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField
              id="required_notes"
              label="Required notes"
              placeholder="Licenses, certifications, or experience needed."
            />
            <TextAreaField
              id="dress_requirements"
              label="Dress requirements"
              placeholder="Scrub color or office dress expectations."
            />
            <TextAreaField
              id="parking_instructions"
              label="Parking"
              placeholder="Where to park and enter."
            />
            <TextAreaField
              id="arrival_instructions"
              label="Arrival"
              placeholder="Who to ask for and when to arrive."
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
      {pending ? "Posting..." : "Post shift"}
    </Button>
  );
}

function Field({
  id,
  label,
  placeholder,
  type = "text"
}: {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} type={type} />
    </div>
  );
}

function SelectField({
  children,
  id,
  label
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
        id={id}
        name={id}
      >
        {children}
      </select>
    </div>
  );
}

function TextAreaField({
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
      <textarea
        className="focus-ring min-h-24 rounded-lg border bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400"
        id={id}
        name={id}
        placeholder={placeholder}
      />
    </div>
  );
}
