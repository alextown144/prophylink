import { Mail, Shield, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InvitationRow = {
  id: string;
  email: string;
  account_kind: "professional" | "office" | "admin";
  status: "active" | "accepted" | "expired" | "revoked";
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

type UserProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
};

type AccountRoleRow = {
  user_id: string;
  kind: "professional" | "office" | "admin";
  onboarding_completed_at: string | null;
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const { invitations, roles, users } = await getUserAdminData();

  return (
    <main className="container py-10">
      <div className="mb-6">
        <Badge variant="secondary">Invite-only beta</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Users and invitations
        </h1>
        <p className="mt-2 max-w-3xl leading-7 text-slate-600">
          Create beta invitations, copy the one-time code, and watch accepted
          invites turn into user records. Marketplace access does not require a
          separate approval gate after onboarding.
        </p>
      </div>

      <div className="mb-6">
        <InvitationForm />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {invitations.length > 0 ? (
              invitations.map((invite) => (
                <div className="rounded-lg border bg-white p-4" key={invite.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-semibold text-slate-950">
                        <Mail className="h-5 w-5 text-teal-700" />
                        {invite.email}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Created {formatDate(invite.created_at)}
                        {invite.expires_at ? `, expires ${formatDate(invite.expires_at)}` : ""}
                      </p>
                    </div>
                    <Badge variant={invite.status === "active" ? "default" : "secondary"}>
                      {invite.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {formatAccountKind(invite.account_kind)}
                    </span>
                    <span>
                      {invite.accepted_at
                        ? `Accepted ${formatDate(invite.accepted_at)}`
                        : "Not accepted yet"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                No invitations yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {users.length > 0 ? (
              users.map((user) => {
                const userRoles = roles.filter((role) => role.user_id === user.id);

                return (
                  <div className="rounded-lg border bg-white p-4" key={user.id}>
                    <p className="flex items-center gap-2 font-semibold text-slate-950">
                      <UserRound className="h-5 w-5 text-teal-700" />
                      {user.display_name || user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {userRoles.map((role) => (
                        <Badge key={`${user.id}-${role.kind}`} variant="outline">
                          {formatAccountKind(role.kind)}
                          {role.onboarding_completed_at ? " onboarded" : ""}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                No users have signed up yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getUserAdminData() {
  const supabase = createSupabaseAdminClient();
  const [invitationsResult, usersResult, rolesResult] = await Promise.all([
    supabase
      .from("signup_invitations")
      .select("id, email, account_kind, status, expires_at, accepted_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_profiles")
      .select("id, email, display_name")
      .order("email", { ascending: true }),
    supabase.from("account_roles").select("user_id, kind, onboarding_completed_at")
  ]);

  return {
    invitations: (invitationsResult.data ?? []) as InvitationRow[],
    roles: (rolesResult.data ?? []) as AccountRoleRow[],
    users: (usersResult.data ?? []) as UserProfileRow[]
  };
}

function formatAccountKind(kind: InvitationRow["account_kind"] | AccountRoleRow["kind"]) {
  return kind === "office" ? "Office" : kind === "admin" ? "Admin" : "Professional";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
