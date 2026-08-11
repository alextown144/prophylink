import { Mail, Shield, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const invitations = [
  {
    email: "sarah@example.com",
    accountKind: "Professional",
    status: "Active",
    expires: "Aug 31, 2026"
  },
  {
    email: "manager@example.com",
    accountKind: "Office",
    status: "Accepted",
    expires: "Aug 31, 2026"
  }
];

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <main className="container py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary">Invite-only beta</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Users and invitations
          </h1>
          <p className="mt-2 leading-7 text-slate-600">
            Admin-created invitations control beta signup. Marketplace access does
            not require a separate approval gate after onboarding.
          </p>
        </div>
        <Button type="button">
          <UserPlus className="h-4 w-4" />
          Create invite
        </Button>
      </div>
      <div className="mb-6">
        <InvitationForm />
      </div>
      <section className="grid gap-4">
        {invitations.map((invite) => (
          <Card key={invite.email}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-5 w-5 text-teal-700" />
                  {invite.email}
                </span>
                <Badge variant={invite.status === "Active" ? "default" : "secondary"}>
                  {invite.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {invite.accountKind}
              </span>
              <span>Expires {invite.expires}</span>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
