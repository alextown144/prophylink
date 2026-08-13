import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import {
  SubscriptionPlanEditor,
  type SubscriptionPlanEditorRow
} from "@/components/admin/subscription-plan-editor";
import { Badge } from "@/components/ui/badge";

type SubscriptionPlanRow = {
  id: string;
  code: string;
  name: string;
  account_kind: "professional" | "office" | "admin";
  entitlements: Json;
  enabled: boolean;
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const plans = await getSubscriptionPlans();

  return (
    <main className="container py-10">
      <div className="mb-6">
        <Badge variant="secondary">Admin configurable</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Subscription capability gates
        </h1>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          Change which capabilities each plan unlocks. Server actions enforce
          these gates for posting shifts, selecting professionals, sending
          interest, and booking messages.
        </p>
      </div>
      <SubscriptionPlanEditor plans={plans} />
    </main>
  );
}

async function getSubscriptionPlans() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("id, code, name, account_kind, entitlements, enabled")
    .order("account_kind", { ascending: true })
    .order("name", { ascending: true });

  return ((data ?? []) as SubscriptionPlanRow[]).map((plan) => ({
    ...plan,
    entitlements: parseEntitlements(plan.entitlements)
  })) satisfies SubscriptionPlanEditorRow[];
}

function parseEntitlements(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => entry[1] === true)
  );
}
