import { SlidersHorizontal } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionCapabilities } from "@/lib/product/constants";

const plans: Array<{ name: string; enabled: string[] }> = [
  {
    name: "Professional Free",
    enabled: ["professional_profile", "availability", "browse_shifts"]
  },
  {
    name: "Professional Plus",
    enabled: [
      "professional_profile",
      "availability",
      "browse_shifts",
      "coverage_exchange",
      "coverage_circle",
      "advanced_alerts"
    ]
  },
  {
    name: "Office Basic",
    enabled: ["office_profile", "professional_search", "post_shifts", "messaging"]
  },
  {
    name: "Office Pro",
    enabled: [
      "office_profile",
      "professional_search",
      "post_shifts",
      "messaging",
      "multiple_locations",
      "marketplace_analytics"
    ]
  }
];

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  return (
    <main className="container py-10">
      <div className="mb-6">
        <Badge variant="secondary">Admin configurable</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Subscription capability gates
        </h1>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          This shell models the admin-selectable gates for plan packaging.
          Stripe wiring and persisted edits belong to the billing milestone.
        </p>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-teal-700" />
                {plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {subscriptionCapabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant={plan.enabled.includes(capability) ? "default" : "outline"}
                >
                  {capability.replaceAll("_", " ")}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
