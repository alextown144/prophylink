import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveEntitlementsForPlans } from "@/lib/entitlements";
import type { SubscriptionCapability } from "@/lib/product/constants";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export type AccountKindForGate = "professional" | "office";

type SubscriptionPlanRow = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "account_kind" | "code" | "enabled" | "entitlements" | "id"
>;

type SubscriptionRow = {
  plan_id: string;
  status: Database["public"]["Enums"]["subscription_status"];
};

type OrganizationMembership = {
  organization_id: string;
};

export async function userHasCapability(
  admin: AdminClient,
  userId: string,
  capability: SubscriptionCapability
) {
  const [professionalAccess, officeAccess] = await Promise.all([
    userHasProfessionalCapability(admin, userId, capability),
    userHasAnyOfficeCapability(admin, userId, capability)
  ]);

  return professionalAccess || officeAccess;
}

export async function userHasProfessionalCapability(
  admin: AdminClient,
  userId: string,
  capability: SubscriptionCapability
) {
  return subjectHasCapability(admin, {
    accountKind: "professional",
    capability,
    userId
  });
}

export async function organizationHasCapability(
  admin: AdminClient,
  organizationId: string,
  capability: SubscriptionCapability
) {
  return subjectHasCapability(admin, {
    accountKind: "office",
    capability,
    organizationId
  });
}

export async function userHasAnyOfficeCapability(
  admin: AdminClient,
  userId: string,
  capability: SubscriptionCapability
) {
  const { data } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);
  const organizationIds = ((data ?? []) as OrganizationMembership[]).map(
    (membership) => membership.organization_id
  );

  if (organizationIds.length === 0) {
    return false;
  }

  const results = await Promise.all(
    organizationIds.map((organizationId) =>
      organizationHasCapability(admin, organizationId, capability)
    )
  );

  return results.some(Boolean);
}

async function subjectHasCapability(
  admin: AdminClient,
  {
    accountKind,
    capability,
    organizationId,
    userId
  }: {
    accountKind: AccountKindForGate;
    capability: SubscriptionCapability;
    organizationId?: string;
    userId?: string;
  }
) {
  const [plansResult, subscriptionsResult] = await Promise.all([
    admin
      .from("subscription_plans")
      .select("id, code, account_kind, entitlements, enabled")
      .eq("account_kind", accountKind)
      .eq("enabled", true),
    buildSubscriptionQuery(admin, { organizationId, userId })
  ]);
  const entitlements = effectiveEntitlementsForPlans({
    accountKind,
    plans: (plansResult.data ?? []) as SubscriptionPlanRow[],
    subscriptions: (subscriptionsResult.data ?? []) as SubscriptionRow[]
  });

  return entitlements[capability] === true;
}

function buildSubscriptionQuery(
  admin: AdminClient,
  {
    organizationId,
    userId
  }: {
    organizationId?: string;
    userId?: string;
  }
) {
  let query = admin.from("subscriptions").select("plan_id, status");

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("id", "__missing_subject__");
  }

  return query;
}
