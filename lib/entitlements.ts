export type AccountKind = "professional" | "office" | "admin";
export type PlanCode =
  | "professional_free"
  | "professional_plus"
  | "office_basic"
  | "office_pro";

export type AccountKindForEntitlements = "professional" | "office";

export type EntitlementPlan = {
  id: string;
  code: PlanCode | string;
  account_kind: AccountKindForEntitlements | "admin";
  entitlements: unknown;
  enabled: boolean;
};

export type EntitlementSubscription = {
  plan_id: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "cancelled"
    | "unpaid"
    | "incomplete"
    | "none";
};

const planCapabilities: Record<PlanCode, string[]> = {
  professional_free: [
    "profile",
    "availability",
    "browse_shifts",
    "receive_invitations",
    "express_interest",
    "messaging"
  ],
  professional_plus: [
    "profile",
    "availability",
    "browse_shifts",
    "receive_invitations",
    "express_interest",
    "messaging",
    "coverage_exchange",
    "coverage_circle",
    "advanced_alerts"
  ],
  office_basic: [
    "office_profile",
    "professional_search",
    "post_shifts",
    "request_professionals",
    "messaging",
    "favorites"
  ],
  office_pro: [
    "office_profile",
    "professional_search",
    "post_shifts",
    "request_professionals",
    "messaging",
    "favorites",
    "multiple_locations",
    "analytics",
    "preferred_roster"
  ]
};

export function planAllows(planCode: PlanCode, capability: string) {
  return planCapabilities[planCode].includes(capability);
}

const defaultPlanByAccountKind = {
  office: "office_basic",
  professional: "professional_free"
} satisfies Record<AccountKindForEntitlements, PlanCode>;

const paidPlanFallbackByAccountKind = {
  office: "office_pro",
  professional: "professional_plus"
} satisfies Record<AccountKindForEntitlements, PlanCode>;

const activeSubscriptionStatuses = new Set<EntitlementSubscription["status"]>([
  "active",
  "trialing"
]);

export function effectiveEntitlementsForPlans({
  accountKind,
  plans,
  subscriptions
}: {
  accountKind: AccountKindForEntitlements;
  plans: EntitlementPlan[];
  subscriptions: EntitlementSubscription[];
}) {
  const enabledPlans = plans.filter(
    (plan) => plan.enabled && plan.account_kind === accountKind
  );
  const plansByCode = new Map(enabledPlans.map((plan) => [plan.code, plan]));
  const plansById = new Map(enabledPlans.map((plan) => [plan.id, plan]));
  const defaultPlan = plansByCode.get(defaultPlanByAccountKind[accountKind]);
  const activePlans = subscriptions
    .filter((subscription) => activeSubscriptionStatuses.has(subscription.status))
    .map((subscription) => plansById.get(subscription.plan_id))
    .filter((plan): plan is EntitlementPlan => Boolean(plan));
  const selectedPlans =
    activePlans.length > 0
      ? [defaultPlan, ...activePlans].filter((plan): plan is EntitlementPlan => Boolean(plan))
      : defaultPlan
        ? [defaultPlan]
        : [plansByCode.get(paidPlanFallbackByAccountKind[accountKind])].filter(
            (plan): plan is EntitlementPlan => Boolean(plan)
          );

  return selectedPlans.reduce<Record<string, boolean>>((entitlements, plan) => {
    return {
      ...entitlements,
      ...parseEntitlements(plan.entitlements)
    };
  }, {});
}

function parseEntitlements(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => entry[1] === true)
  );
}
