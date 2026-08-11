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
  "professional_profile",
  "availability",
  "browse_shifts",
  "coverage_exchange",
  "coverage_circle",
  "office_profile",
  "professional_search",
  "post_shifts",
  "messaging",
  "multiple_locations",
  "advanced_alerts",
  "marketplace_analytics"
] as const;
