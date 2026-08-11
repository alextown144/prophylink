import { CalendarDays, ClipboardList, MessageCircle, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";

export default async function ProfessionalDashboardPage() {
  await requireUser();

  return (
    <DashboardShell
      eyebrow="Professional dashboard"
      title="Good afternoon, Sarah"
      description="A placeholder shell for availability, nearby shifts, coverage requests, messages, and credential status."
    >
      <MetricCard icon={CalendarDays} label="Available days" value="7" />
      <MetricCard icon={ClipboardList} label="Nearby open shifts" value="3" />
      <MetricCard icon={ShieldCheck} label="Credentials pending" value="1" />
      <MetricCard icon={MessageCircle} label="Unread messages" value="0" />
    </DashboardShell>
  );
}
