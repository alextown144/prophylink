"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarDays, Clock3, Repeat2, Trash2 } from "lucide-react";
import {
  deleteAvailabilityRule,
  saveAvailabilityRule
} from "@/app/professional/availability/actions";
import {
  formatAvailabilityDate,
  formatTimeRange,
  parseWeeklyRecurrenceDays,
  todayIsoDate,
  weekdayOptions
} from "@/lib/availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AvailabilityRuleView = {
  id: string;
  kind: "available" | "unavailable";
  starts_at: string | null;
  ends_at: string | null;
  recurrence_rule: string | null;
  recurrence_starts_on: string | null;
  recurrence_ends_on: string | null;
  notes: string | null;
};

export function AvailabilityRuleManager({
  rules
}: {
  rules: AvailabilityRuleView[];
}) {
  const defaultDate = todayIsoDate();

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <AvailabilityFormCard
          defaultDate={defaultDate}
          description="Pick a specific day to mark yourself available or unavailable."
          icon={<CalendarDays className="h-5 w-5" />}
          mode="single"
          title="Individual day"
        />
        <AvailabilityFormCard
          defaultDate={defaultDate}
          description="Set a repeating weekly pattern such as every Monday and Wednesday."
          icon={<Repeat2 className="h-5 w-5" />}
          mode="weekly"
          title="Repeating weekly"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Saved availability</CardTitle>
          <CardDescription>
            These rules are already stored in Supabase and will feed search and
            matching in the next marketplace milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {rules.length > 0 ? (
            rules.map((rule) => <AvailabilityRuleCard key={rule.id} rule={rule} />)
          ) : (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No availability saved yet. Add an individual date or repeating weekly
              rule above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AvailabilityFormCard({
  defaultDate,
  description,
  icon,
  mode,
  title
}: {
  defaultDate: string;
  description: string;
  icon: React.ReactNode;
  mode: "single" | "weekly";
  title: string;
}) {
  const [state, formAction] = useActionState(saveAvailabilityRule, {
    ok: false,
    message: ""
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-teal-700">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input name="mode" type="hidden" value={mode} />
          <div className="grid gap-2">
            <Label htmlFor={`${mode}_kind`}>Status</Label>
            <select
              className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
              defaultValue="available"
              id={`${mode}_kind`}
              name="kind"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {mode === "single" ? (
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input defaultValue={defaultDate} id="date" name="date" required type="date" />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Repeat on</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {weekdayOptions.map((day) => (
                    <label
                      className="flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700"
                      key={day.value}
                    >
                      <input
                        className="h-4 w-4 accent-teal-700"
                        name="weekdays"
                        type="checkbox"
                        value={day.value}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="recurrence_starts_on">Starts</Label>
                  <Input
                    defaultValue={defaultDate}
                    id="recurrence_starts_on"
                    name="recurrence_starts_on"
                    required
                    type="date"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurrence_ends_on">Ends optional</Label>
                  <Input id="recurrence_ends_on" name="recurrence_ends_on" type="date" />
                </div>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${mode}_start_time`}>Start time</Label>
              <Input
                defaultValue="08:00"
                id={`${mode}_start_time`}
                name="start_time"
                required
                type="time"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${mode}_end_time`}>End time</Label>
              <Input
                defaultValue="17:00"
                id={`${mode}_end_time`}
                name="end_time"
                required
                type="time"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${mode}_notes`}>Note optional</Label>
            <Input
              id={`${mode}_notes`}
              name="notes"
              placeholder="Prefer hygiene shifts within 25 miles"
            />
          </div>

          {state.message ? (
            <p
              className={`rounded-lg p-3 text-sm ${
                state.ok ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"
              }`}
              role="status"
            >
              {state.message}
            </p>
          ) : null}
          <SubmitButton label={mode === "single" ? "Save date" : "Save weekly rule"} />
        </form>
      </CardContent>
    </Card>
  );
}

function AvailabilityRuleCard({ rule }: { rule: AvailabilityRuleView }) {
  const recurringDays = parseWeeklyRecurrenceDays(rule.recurrence_rule);
  const isRecurring = recurringDays.length > 0;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={rule.kind === "available" ? "default" : "secondary"}>
            {rule.kind === "available" ? "Available" : "Unavailable"}
          </Badge>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
            <Clock3 className="h-4 w-4 text-teal-700" />
            {formatTimeRange(rule.starts_at, rule.ends_at)}
          </span>
        </div>
        <p className="mt-2 font-semibold text-slate-950">
          {isRecurring
            ? `Every ${recurringDays.join(", ")}`
            : formatAvailabilityDate(rule.starts_at)}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {isRecurring
            ? `Starts ${formatRuleDate(rule.recurrence_starts_on)}${
                rule.recurrence_ends_on ? `, ends ${formatRuleDate(rule.recurrence_ends_on)}` : ""
              }`
            : "Individual date"}
        </p>
        {rule.notes ? <p className="mt-2 text-sm text-slate-600">{rule.notes}</p> : null}
      </div>
      <form action={deleteAvailabilityRule}>
        <input name="id" type="hidden" value={rule.id} />
        <Button size="sm" type="submit" variant="outline">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </form>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving..." : label}
    </Button>
  );
}

function formatRuleDate(value: string | null) {
  if (!value) {
    return "today";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
