import { BadgeCheck, BriefcaseBusiness, ClipboardList, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <DashboardShell
      eyebrow="Admin dashboard"
      title="Marketplace control center"
      description="A placeholder shell for user oversight, credential review, office review, shifts, coverage requests, bookings, and concierge matching."
    >
      <MetricCard icon={UsersRound} label="Professionals" value="24" />
      <MetricCard icon={BriefcaseBusiness} label="Offices" value="5" />
      <MetricCard icon={ClipboardList} label="Open shifts" value="4" />
      <MetricCard icon={BadgeCheck} label="Pending credentials" value="8" />
    </DashboardShell>
  );
}
