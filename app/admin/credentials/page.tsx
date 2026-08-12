import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  FileText,
  UserRound,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { reviewProfessionalCredential } from "@/app/admin/credentials/actions";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{
  review?: string;
}>;

type CredentialReviewRow = {
  id: string;
  credential_number: string | null;
  issuing_state: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  file_path: string | null;
  status: "pending" | "verified" | "rejected" | "expired";
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
  credential_types: {
    name: string;
    requires_expiration: boolean;
  } | null;
  professional_profiles: {
    user_profiles: {
      display_name: string | null;
      email: string;
      city: string | null;
      state: string | null;
    } | null;
    professional_roles: {
      name: string;
    } | null;
  } | null;
  signedUrl?: string | null;
};

const credentialBucket = "credentials";

export default async function AdminCredentialsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const { review } = await searchParams;
  const credentials = await getCredentialReviewQueue();
  const pending = credentials.filter((credential) => credential.status === "pending");
  const reviewed = credentials.filter((credential) => credential.status !== "pending");

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Admin dashboard
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Credential review
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Professional credential queue
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Review submitted credentials and mark them verified or rejected for beta testing.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">Users and invitations</Link>
        </Button>
      </div>

      <ReviewMessage status={review} />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Pending" value={String(pending.length)} />
        <Metric
          label="Verified"
          value={String(credentials.filter((credential) => credential.status === "verified").length)}
        />
        <Metric
          label="Rejected"
          value={String(credentials.filter((credential) => credential.status === "rejected").length)}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pending review</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pending.length > 0 ? (
              pending.map((credential) => (
                <CredentialReviewCard credential={credential} key={credential.id} />
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No credentials are waiting for review.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent reviewed</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {reviewed.length > 0 ? (
              reviewed.slice(0, 8).map((credential) => (
                <CredentialReviewCard credential={credential} key={credential.id} compact />
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Reviewed credentials will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getCredentialReviewQueue() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("professional_credentials")
    .select(
      "id, credential_number, issuing_state, issue_date, expiration_date, file_path, status, rejection_reason, verified_at, created_at, credential_types(name, requires_expiration), professional_profiles(user_profiles(display_name, email, city, state), professional_roles(name))"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  const credentials = (data ?? []) as CredentialReviewRow[];

  return Promise.all(
    credentials.map(async (credential) => {
      if (!credential.file_path) {
        return { ...credential, signedUrl: null };
      }

      const { data: signedData } = await admin.storage
        .from(credentialBucket)
        .createSignedUrl(credential.file_path, 300);

      return { ...credential, signedUrl: signedData?.signedUrl ?? null };
    })
  );
}

function CredentialReviewCard({
  compact = false,
  credential
}: {
  compact?: boolean;
  credential: CredentialReviewRow;
}) {
  const profile = credential.professional_profiles;
  const userProfile = profile?.user_profiles;
  const displayName = userProfile?.display_name ?? userProfile?.email ?? "Professional";

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <UserRound className="h-4 w-4 text-teal-700" />
            {displayName}
          </p>
          <p className="mt-1 text-sm font-semibold text-teal-700">
            {profile?.professional_roles?.name ?? "Professional"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {[userProfile?.city, userProfile?.state].filter(Boolean).join(", ") || "Location not saved"}
          </p>
        </div>
        <Badge variant={credential.status === "verified" ? "default" : "outline"}>
          {formatStatus(credential.status)}
        </Badge>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="font-semibold text-slate-950">
          {credential.credential_types?.name ?? "Credential"}
        </p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <Fact label="Number" value={credential.credential_number} />
          <Fact label="Issuing state" value={credential.issuing_state} />
          <Fact label="Issue date" value={formatDate(credential.issue_date)} />
          <Fact label="Expiration" value={formatDate(credential.expiration_date)} />
        </dl>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-4 w-4 text-teal-700" />
          Submitted {formatDateTime(credential.created_at)}
        </span>
        {credential.file_path ? (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-4 w-4 text-teal-700" />
            File attached
          </span>
        ) : null}
        {credential.verified_at ? (
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-4 w-4 text-teal-700" />
            Reviewed {formatDateTime(credential.verified_at)}
          </span>
        ) : null}
      </div>

      {credential.rejection_reason ? (
        <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm leading-6 text-slate-700">
          {credential.rejection_reason}
        </p>
      ) : null}

      {!compact ? (
        <div className="mt-4 grid gap-3">
          {credential.signedUrl ? (
            <Button asChild variant="outline">
              <a href={credential.signedUrl} rel="noreferrer" target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open file
              </a>
            </Button>
          ) : null}
          {credential.status === "pending" ? (
            <div className="grid gap-3 rounded-lg border bg-white p-3">
              <form action={reviewProfessionalCredential}>
                <input name="credential_id" type="hidden" value={credential.id} />
                <input name="action" type="hidden" value="verify" />
                <Button type="submit">
                  <BadgeCheck className="h-4 w-4" />
                  Verify credential
                </Button>
              </form>
              <form action={reviewProfessionalCredential} className="grid gap-2">
                <input name="credential_id" type="hidden" value={credential.id} />
                <input name="action" type="hidden" value="reject" />
                <label className="text-sm font-semibold text-slate-700" htmlFor={`reject-${credential.id}`}>
                  Rejection reason
                </label>
                <textarea
                  className="focus-ring min-h-20 rounded-lg border bg-white px-3 py-2 text-sm"
                  id={`reject-${credential.id}`}
                  name="rejection_reason"
                  placeholder="Example: expiration date is not visible."
                  required
                />
                <Button type="submit" variant="outline">
                  <XCircle className="h-4 w-4" />
                  Reject credential
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        <p className="mt-1 text-sm text-slate-600">{label}</p>
      </CardContent>
    </Card>
  );
}

function ReviewMessage({ status }: { status?: string }) {
  const message =
    {
      failed: "Credential review could not be saved.",
      invalid: "Check the credential review action.",
      rejected: "Credential rejected and the professional was notified.",
      verified: "Credential verified and the professional was notified."
    }[status ?? ""] ?? null;

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value || "Not provided"}</dd>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatStatus(value: CredentialReviewRow["status"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
