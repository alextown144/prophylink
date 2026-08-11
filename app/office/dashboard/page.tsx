import { Building2, CalendarCheck, Search, UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function OfficeDashboardPage() {
  await requireUser();

  return (
    <DashboardShell
      eyebrow="Dental office dashboard"
      title="Good morning, Richland Family Dental"
      description="A placeholder shell for shift coverage, professional search, preferred roster, messages, and billing status."
    >
      <MetricCard icon={CalendarCheck} label="Filled shifts" value="1" />
      <MetricCard icon={Search} label="Open shifts" value="2" />
      <MetricCard icon={UsersRound} label="Available today" value="19" />
      <MetricCard icon={Building2} label="Locations" value="1" />
    </DashboardShell>
  );
}
