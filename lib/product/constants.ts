export const launchProfessionalRoles = [
  {
    slug: "dental_hygienist",
    label: "Dental Hygienist",
    description: "Temporary hygiene coverage, open shifts, and peer coverage requests."
  },
  {
    slug: "dental_assistant",
    label: "Dental Assistant",
    description: "Chairside, sterilization, specialty, and general assisting coverage."
  }
] as const;

export const tricities = [
  "Richland",
  "Kennewick",
  "Pasco",
  "West Richland",
  "Benton City",
  "Burbank"
] as const;

export const subscriptionCapabilities = [
  "profile",
  "availability",
  "browse_shifts",
  "receive_invitations",
  "express_interest",
  "coverage_exchange",
  "coverage_circle",
  "advanced_alerts",
  "office_profile",
  "professional_search",
  "post_shifts",
  "request_professionals",
  "messaging",
  "favorites",
  "multiple_locations",
  "analytics",
  "preferred_roster"
] as const;

export type SubscriptionCapability = (typeof subscriptionCapabilities)[number];
