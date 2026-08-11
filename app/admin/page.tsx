import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardList,
  Mail,
  Settings,
  UserPlus,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { InvitationForm } from "@/components/admin/invitation-form";
import { MetricCard } from "@/components/dashboard/metric-card";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InvitationRow = {
  id: string;
  email: string;
  account_kind: "professional" | "office" | "admin";
  status: "active" | "accepted" | "expired" | "revoked";
  expires_at: string | null;
  created_at: string;
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const { activeInvites, adminRoles, officeRoles, professionalRoles, recentInvites, users } =
    await getAdminOverview();

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Beta control center
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Manage invite-only access, review live beta setup, and jump into the
            pages needed for the next setup tests.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="#create-invite">
              <UserPlus className="h-4 w-4" />
              Create invite
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">View users</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={UsersRound} label="Total users" value={String(users)} />
        <MetricCard
          icon={BadgeCheck}
          label="Professional accounts"
          value={String(professionalRoles)}
        />
        <MetricCard
          icon={BriefcaseBusiness}
          label="Office accounts"
          value={String(officeRoles)}
        />
        <MetricCard icon={Mail} label="Active invites" value={String(activeInvites)} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="create-invite">
          <InvitationForm />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-700" />
              Next setup tests
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <AdminAction
              href="/admin/users"
              label="Create a hygienist test invite"
              text="Use a second email so we can test professional onboarding without admin access."
            />
            <AdminAction
              href="/admin/users"
              label="Create an office test invite"
              text="Use a different email to test organization and location setup."
            />
            <AdminAction
              href="/admin/subscriptions"
              label="Review subscription gates"
              text="Confirm which plan capabilities should unlock first during beta."
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent invitations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentInvites.length > 0 ? (
              recentInvites.map((invite) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"
                  key={invite.id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">{invite.email}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatAccountKind(invite.account_kind)} invite
                      {invite.expires_at ? `, expires ${formatDate(invite.expires_at)}` : ""}
                    </p>
                  </div>
                  <Badge variant={invite.status === "active" ? "default" : "secondary"}>
                    {invite.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                No invitations yet. Create one above to begin testing.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-teal-700" />
              Beta status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <StatusLine label="Admin roles" value={adminRoles} />
            <StatusLine label="Invite mode" value="invite_only" />
            <StatusLine label="Marketplace approval" value="not required" />
            <StatusLine label="Coverage exchange MVP" value="professional-to-professional" />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getAdminOverview() {
  const supabase = createSupabaseAdminClient();
  const [
    usersResult,
    professionalRolesResult,
    officeRolesResult,
    adminRolesResult,
    activeInvitesResult,
    invitationsResult
  ] = await Promise.all([
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("account_roles")
      .select("id", { count: "exact", head: true })
      .eq("kind", "professional"),
    supabase
      .from("account_roles")
      .select("id", { count: "exact", head: true })
      .eq("kind", "office"),
    supabase
      .from("account_roles")
      .select("id", { count: "exact", head: true })
      .eq("kind", "admin"),
    supabase
      .from("signup_invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("signup_invitations")
      .select("id, email, account_kind, status, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  return {
    activeInvites: activeInvitesResult.count ?? 0,
    adminRoles: adminRolesResult.count ?? 0,
    officeRoles: officeRolesResult.count ?? 0,
    professionalRoles: professionalRolesResult.count ?? 0,
    recentInvites: (invitationsResult.data ?? []) as InvitationRow[],
    users: usersResult.count ?? 0
  };
}

function AdminAction({
  href,
  label,
  text
}: {
  href: string;
  label: string;
  text: string;
}) {
  return (
    <Link
      className="focus-ring group rounded-lg border bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50"
      href={href}
    >
      <span className="flex items-center justify-between gap-3 font-semibold text-slate-950">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
      <span className="mt-2 block leading-6 text-slate-600">{text}</span>
    </Link>
  );
}

function StatusLine({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function formatAccountKind(kind: InvitationRow["account_kind"]) {
  return kind === "office" ? "Office" : kind === "admin" ? "Admin" : "Professional";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
