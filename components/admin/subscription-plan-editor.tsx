"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { updateSubscriptionPlanEntitlements } from "@/app/admin/subscriptions/actions";
import {
  subscriptionCapabilities,
  type SubscriptionCapability
} from "@/lib/product/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type SubscriptionPlanEditorRow = {
  id: string;
  code: string;
  name: string;
  account_kind: "professional" | "office" | "admin";
  entitlements: Record<string, boolean>;
  enabled: boolean;
};

export function SubscriptionPlanEditor({
  plans
}: {
  plans: SubscriptionPlanEditorRow[];
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {plans.map((plan) => (
        <SubscriptionPlanCard key={plan.id} plan={plan} />
      ))}
    </section>
  );
}

function SubscriptionPlanCard({ plan }: { plan: SubscriptionPlanEditorRow }) {
  const [state, formAction] = useActionState(updateSubscriptionPlanEntitlements, {
    ok: false,
    message: ""
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-teal-700" />
          {plan.name}
        </CardTitle>
        <CardDescription>
          {formatAccountKind(plan.account_kind)} plan code: {plan.code}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input name="plan_id" type="hidden" value={plan.id} />
          <div className="grid gap-2">
            {subscriptionCapabilities.map((capability) => (
              <CapabilityCheckbox
                capability={capability}
                checked={plan.entitlements[capability] === true}
                key={capability}
              />
            ))}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant={plan.enabled ? "default" : "outline"}>
              {plan.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CapabilityCheckbox({
  capability,
  checked
}: {
  capability: SubscriptionCapability;
  checked: boolean;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-sm">
      <span className="font-semibold text-slate-800">{formatCapability(capability)}</span>
      <input
        className="h-4 w-4 accent-teal-700"
        defaultChecked={checked}
        name="capabilities"
        type="checkbox"
        value={capability}
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit">
      {pending ? "Saving..." : "Save gates"}
    </Button>
  );
}

function formatAccountKind(kind: SubscriptionPlanEditorRow["account_kind"]) {
  return kind === "office" ? "Office" : kind === "admin" ? "Admin" : "Professional";
}

function formatCapability(capability: string) {
  return capability
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
