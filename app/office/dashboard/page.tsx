import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ClipboardList,
  MapPin,
  Search,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AccountRole = {
  kind: "professional" | "office" | "admin";
  onboarding_completed_at: string | null;
};

type Organization = {
  id: string;
  name: string;
  primary_email: string | null;
  primary_phone: string | null;
  website: string | null;
};

type OrganizationMembership = {
  organization_id: string;
};

type Location = {
  id: string;
  name: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  software_used: string[];
};

export default async function OfficeDashboardPage() {
  const user = await requireUser();
  const { accountRoles, locations, organization } = await getOfficeDashboardData(user.id);
  const isAdmin = accountRoles.some((role) => role.kind === "admin");
  const officeRole = accountRoles.find((role) => role.kind === "office");
  const onboardingComplete = Boolean(officeRole?.onboarding_completed_at);

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            Dental office dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {organization?.name ?? "Finish your office setup"}
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your office foundation feeds future shift posting, professional
            search, location management, and subscription access controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/office/profile">
              {organization ? "Edit office profile" : "Finish setup"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/office/locations">Locations</Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="outline">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusMetric
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Office status"
          value={onboardingComplete ? "Complete" : "Needs setup"}
        />
        <StatusMetric
          icon={<Building2 className="h-5 w-5" />}
          label="Locations"
          value={String(locations.length)}
        />
        <StatusMetric
          icon={<UsersRound className="h-5 w-5" />}
          label="Team contacts"
          value={String(locations.filter((location) => location.contact_email).length)}
        />
        <StatusMetric
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Shift posting"
          value="Next"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Office foundation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {organization ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileFact label="Practice" value={organization.name} />
                  <ProfileFact label="Email" value={organization.primary_email} />
                  <ProfileFact label="Phone" value={organization.primary_phone} />
                  <ProfileFact label="Website" value={organization.website} />
                </div>
                <div className="grid gap-3">
                  {locations.map((location) => (
                    <div className="rounded-lg border bg-white p-4" key={location.id}>
                      <p className="flex items-center gap-2 font-semibold text-slate-950">
                        <MapPin className="h-5 w-5 text-teal-700" />
                        {location.name ?? organization.name}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {location.address_line1}, {location.city}, {location.state}{" "}
                        {location.postal_code}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Software:{" "}
                        {location.software_used.length > 0
                          ? location.software_used.join(", ")
                          : "Not saved"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">No office profile yet</p>
                <p className="mt-2 leading-7 text-slate-600">
                  Complete the office profile to create the organization and first
                  location records.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/office/profile">Start office setup</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next setup tests</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ChecklistItem complete={Boolean(organization)} label="Organization saved" />
            <ChecklistItem complete={locations.length > 0} label="First location saved" />
            <ChecklistItem
              complete={Boolean(organization?.primary_email)}
              label="Contact email saved"
            />
            <NextStep
              href="/office/profile"
              label="Update office foundation"
              text="Edit practice, contact, and first-location details."
            />
            <NextStep
              href="/admin/users"
              label="Create a clean office invite"
              text="As admin, test this dashboard with a non-admin office account."
              show={isAdmin}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <FutureCard
          icon={<ClipboardList className="h-5 w-5" />}
          title="Post shifts"
          text="Shift creation will build on the saved organization and location records."
        />
        <FutureCard
          icon={<Search className="h-5 w-5" />}
          title="Search professionals"
          text="Professional discovery will use verified profiles and plan gates."
        />
        <FutureCard
          icon={<ArrowRight className="h-5 w-5" />}
          title="Coverage exchange"
          text="Office approval is intentionally out of the professional-to-professional MVP."
        />
      </section>
    </main>
  );
}

async function getOfficeDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [rolesResult, membershipResult] = await Promise.all([
    supabase
      .from("account_roles")
      .select("kind, onboarding_completed_at")
      .eq("user_id", userId),
    supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
  ]);
  const membership = membershipResult.data as OrganizationMembership | null;
  const organizationId = membership?.organization_id;

  if (!organizationId) {
    return {
      accountRoles: (rolesResult.data ?? []) as AccountRole[],
      locations: [] as Location[],
      organization: null as Organization | null
    };
  }

  const [organizationResult, locationsResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, primary_email, primary_phone, website")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("office_locations")
      .select(
        "id, name, address_line1, city, state, postal_code, phone, contact_name, contact_email, software_used"
      )
      .eq("organization_id", organizationId)
      .order("name", { ascending: true })
  ]);

  return {
    accountRoles: (rolesResult.data ?? []) as AccountRole[],
    locations: (locationsResult.data ?? []) as Location[],
    organization: organizationResult.data as Organization | null
  };
}

function StatusMetric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-32 flex-col justify-between p-5">
        <div className="text-teal-700">{icon}</div>
        <div>
          <p className="text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || "Not saved"}</p>
    </div>
  );
}

function ChecklistItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <Badge variant={complete ? "default" : "outline"}>{complete ? "Done" : "Needed"}</Badge>
    </div>
  );
}

function NextStep({
  href,
  label,
  show = true,
  text
}: {
  href: string;
  label: string;
  show?: boolean;
  text: string;
}) {
  if (!show) {
    return null;
  }

  return (
    <Link
      className="focus-ring group rounded-lg border bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50"
      href={href}
    >
      <span className="flex items-center justify-between gap-3 font-semibold text-slate-950">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
      <span className="mt-2 block text-sm leading-6 text-slate-600">{text}</span>
    </Link>
  );
}

function FutureCard({
  icon,
  text,
  title
}: {
  icon: React.ReactNode;
  text: string;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {icon}
        </div>
        <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}
