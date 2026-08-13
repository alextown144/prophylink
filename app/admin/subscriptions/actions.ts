"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { subscriptionCapabilities } from "@/lib/product/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type ActionResult = {
  ok: boolean;
  message: string;
};

const validCapabilities = new Set<string>(subscriptionCapabilities);

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateSubscriptionPlanEntitlements(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const planId = formString(formData, "plan_id");
  const selectedCapabilities = formData
    .getAll("capabilities")
    .filter((value): value is string => typeof value === "string")
    .filter((capability) => validCapabilities.has(capability));

  if (!planId) {
    return { ok: false, message: "Choose a subscription plan." };
  }

  const entitlements = Object.fromEntries(
    selectedCapabilities.map((capability) => [capability, true])
  ) satisfies Record<string, boolean>;
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("subscription_plans")
    .update({ entitlements: entitlements as Json } as never)
    .eq("id", planId);

  if (error) {
    return { ok: false, message: "Subscription plan could not be updated." };
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/office/dashboard");
  revalidatePath("/professional/dashboard");
  revalidatePath("/messages");

  return { ok: true, message: "Subscription plan gates updated." };
}
