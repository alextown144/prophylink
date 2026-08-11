"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import {
  postOfficeShift,
  type OfficeShiftActionResult
} from "@/app/office/shifts/actions";
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

export type ShiftPostingDefaults = {
  id?: string;
  officeLocationId?: string;
  professionalRoleId?: string;
  status?: "draft" | "open";
  date?: string;
  startTime?: string;
  endTime?: string;
  hourlyRate?: string;
  unpaidLunchMinutes?: string;
  description?: string | null;
  requiredNotes?: string | null;
  dressRequirements?: string | null;
  parkingInstructions?: string | null;
  arrivalInstructions?: string | null;
};

export function ShiftPostingForm({
  action = postOfficeShift,
  defaults,
  submitLabel = "Post shift",
  title = "Post a shift",
  locations,
  roles
}: {
  action?: (
    previousState: OfficeShiftActionResult,
    formData: FormData
  ) => Promise<OfficeShiftActionResult>;
  defaults?: ShiftPostingDefaults;
  submitLabel?: string;
  title?: string;
  locations: ShiftLocationOption[];
  roles: ShiftRoleOption[];
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    message: ""
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-teal-700" />
          {title}
        </CardTitle>
        <CardDescription>
          Create an open shift for professionals to review. Save as draft when the
          details are not ready yet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          {defaults?.id ? (
            <input name="shift_id" type="hidden" value={defaults.id} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              defaultValue={defaults?.officeLocationId}
              id="office_location_id"
              label="Office location"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              defaultValue={defaults?.professionalRoleId}
              id="professional_role_id"
              label="Professional needed"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              defaultValue={defaults?.date}
              id="date"
              label="Date"
              type="date"
            />
            <Field
              defaultValue={defaults?.startTime}
              id="start_time"
              label="Start"
              type="time"
            />
            <Field
              defaultValue={defaults?.endTime}
              id="end_time"
              label="End"
              type="time"
            />
            <SelectField defaultValue={defaults?.status} id="status" label="Status">
              <option value="open">Open shift</option>
              <option value="draft">Draft</option>
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              defaultValue={defaults?.hourlyRate}
              id="hourly_rate"
              label="Hourly rate"
              placeholder="$72"
            />
            <Field
              defaultValue={defaults?.unpaidLunchMinutes}
              id="unpaid_lunch_minutes"
              label="Unpaid lunch minutes"
              placeholder="30"
              type="number"
            />
          </div>
          <TextAreaField
            defaultValue={defaults?.description}
            id="description"
            label="Shift description"
            placeholder="Briefly describe the schedule, patient flow, and anything that helps a professional decide."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField
              defaultValue={defaults?.requiredNotes}
              id="required_notes"
              label="Required notes"
              placeholder="Licenses, certifications, or experience needed."
            />
            <TextAreaField
              defaultValue={defaults?.dressRequirements}
              id="dress_requirements"
              label="Dress requirements"
              placeholder="Scrub color or office dress expectations."
            />
            <TextAreaField
              defaultValue={defaults?.parkingInstructions}
              id="parking_instructions"
              label="Parking"
              placeholder="Where to park and enter."
            />
            <TextAreaField
              defaultValue={defaults?.arrivalInstructions}
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
          <SubmitButton label={submitLabel} />
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ label = "Post shift" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving..." : label}
    </Button>
  );
}

function Field({
  defaultValue,
  id,
  label,
  placeholder,
  type = "text"
}: {
  defaultValue?: string;
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={id}
        name={id}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

function SelectField({
  children,
  defaultValue,
  id,
  label
}: {
  children: React.ReactNode;
  defaultValue?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
        defaultValue={defaultValue}
        id={id}
        name={id}
      >
        {children}
      </select>
    </div>
  );
}

function TextAreaField({
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
      <textarea
        className="focus-ring min-h-24 rounded-lg border bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400"
        defaultValue={defaultValue ?? undefined}
        id={id}
        name={id}
        placeholder={placeholder}
      />
    </div>
  );
}
