export type AccountKind = "professional" | "office" | "admin";
export type PlanCode =
  | "professional_free"
  | "professional_plus"
  | "office_basic"
  | "office_pro";

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
