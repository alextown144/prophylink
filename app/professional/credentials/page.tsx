import { ArrowLeft, BadgeCheck, CalendarDays, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CredentialUploadForm } from "@/components/professional/credential-upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfessionalProfile = {
  id: string;
};

type CredentialType = {
  id: string;
  name: string;
  requires_expiration: boolean;
};

type ProfessionalCredential = {
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
};

export default async function ProfessionalCredentialsPage() {
  const user = await requireUser();
  const { credentialTypes, credentials, professionalProfile } = await getCredentialData(user.id);

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href="/professional/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Professional dashboard
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Credentials
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Credential review
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Upload marketplace credentials for beta admin review. Offices do not
            see credential files.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/professional/profile">Edit profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/professional/shifts">Browse shifts</Link>
          </Button>
        </div>
      </div>

      {!professionalProfile ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-slate-950">Profile setup needed</p>
            <p className="mt-2 leading-7 text-slate-600">
              Complete your professional profile before uploading credentials.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professional/profile">Finish profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <CredentialUploadForm credentialTypes={credentialTypes} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                Submitted credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {credentials.length > 0 ? (
                credentials.map((credential) => (
                  <CredentialCard credential={credential} key={credential.id} />
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  No credentials submitted yet. Upload a license or certification
                  to start review.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}

async function getCredentialData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: professionalProfileData }, { data: credentialTypesData }] =
    await Promise.all([
      supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("credential_types")
        .select("id, name, requires_expiration")
        .order("name", { ascending: true })
    ]);
  const professionalProfile = professionalProfileData as ProfessionalProfile | null;
  let credentials: ProfessionalCredential[] = [];

  if (professionalProfile) {
    const { data } = await supabase
      .from("professional_credentials")
      .select(
        "id, credential_number, issuing_state, issue_date, expiration_date, file_path, status, rejection_reason, verified_at, created_at, credential_types(name, requires_expiration)"
      )
      .eq("professional_profile_id", professionalProfile.id)
      .order("created_at", { ascending: false });
    credentials = (data ?? []) as ProfessionalCredential[];
  }

  return {
    credentialTypes: (credentialTypesData ?? []) as CredentialType[],
    credentials,
    professionalProfile
  };
}

function CredentialCard({ credential }: { credential: ProfessionalCredential }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">
            {credential.credential_types?.name ?? "Credential"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Submitted {formatDateTime(credential.created_at)}
          </p>
        </div>
        <Badge variant={credential.status === "verified" ? "default" : "outline"}>
          {formatStatus(credential.status)}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
        <Fact label="Number" value={credential.credential_number} />
        <Fact label="Issuing state" value={credential.issuing_state} />
        <Fact label="Issue date" value={formatDate(credential.issue_date)} />
        <Fact label="Expiration" value={formatDate(credential.expiration_date)} />
      </dl>
      {credential.rejection_reason ? (
        <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm leading-6 text-slate-700">
          {credential.rejection_reason}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <FileText className="h-4 w-4 text-teal-700" />
          {credential.file_path ? "File uploaded" : "No file"}
        </span>
        {credential.verified_at ? (
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-4 w-4 text-teal-700" />
            Verified {formatDateTime(credential.verified_at)}
          </span>
        ) : null}
        {credential.expiration_date ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-teal-700" />
            Expires {formatDate(credential.expiration_date)}
          </span>
        ) : null}
      </div>
    </div>
  );
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

function formatStatus(value: ProfessionalCredential["status"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
