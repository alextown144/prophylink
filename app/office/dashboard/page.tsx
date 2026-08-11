import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarPlus,
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

type PostedShift = {
  id: string;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
  interested_count: number;
  office_locations: {
    name: string | null;
    city: string;
    state: string;
  } | null;
  professional_roles: {
    name: string;
  } | null;
};

export default async function OfficeDashboardPage() {
  const user = await requireUser();
  const { accountRoles, locations, organization, shifts } = await getOfficeDashboardData(
    user.id
  );
  const isAdmin = accountRoles.some((role) => role.kind === "admin");
  const officeRole = accountRoles.find((role) => role.kind === "office");
  const onboardingComplete = Boolean(officeRole?.onboarding_completed_at);
  const openShiftCount = shifts.filter((shift) => shift.status === "open").length;

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
            <Link href="/office/shifts/new">
              <CalendarPlus className="h-4 w-4" />
              Post a shift
            </Link>
          </Button>
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
          label="Open shifts"
          value={String(openShiftCount)}
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Posted shifts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {shifts.length > 0 ? (
              shifts.map((shift) => <PostedShiftRow key={shift.id} shift={shift} />)
            ) : (
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">No shifts posted yet</p>
                <p className="mt-2 leading-7 text-slate-600">
                  Create your first open shift for dental professionals to review.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/office/shifts/new">
                    <CalendarPlus className="h-4 w-4" />
                    Post a shift
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <FutureCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="Shift workflow"
            text="Next milestones will add candidate matching, booking requests, and office-side confirmations."
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
        </div>
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
      organization: null as Organization | null,
      shifts: [] as PostedShift[]
    };
  }

  const [organizationResult, locationsResult, shiftsResult, bookingsResult] =
    await Promise.all([
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
      .order("name", { ascending: true }),
    supabase
      .from("shifts")
      .select(
        "id, status, starts_at, ends_at, hourly_rate_cents, office_locations(name, city, state), professional_roles(name)"
      )
      .eq("organization_id", organizationId)
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
      .from("bookings")
      .select("shift_id, status")
      .eq("organization_id", organizationId)
  ]);
  const interestCountByShiftId = new Map<string, number>();

  ((bookingsResult.data ?? []) as { shift_id: string | null; status: string }[]).forEach(
    (booking) => {
      if (!booking.shift_id || booking.status !== "interested") {
        return;
      }

      interestCountByShiftId.set(
        booking.shift_id,
        (interestCountByShiftId.get(booking.shift_id) ?? 0) + 1
      );
    }
  );
  const shifts = ((shiftsResult.data ?? []) as Omit<PostedShift, "interested_count">[]).map(
    (shift) => ({
      ...shift,
      interested_count: interestCountByShiftId.get(shift.id) ?? 0
    })
  );

  return {
    accountRoles: (rolesResult.data ?? []) as AccountRole[],
    locations: (locationsResult.data ?? []) as Location[],
    organization: organizationResult.data as Organization | null,
    shifts
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

function PostedShiftRow({ shift }: { shift: PostedShift }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-slate-950">
            {shift.professional_roles?.name ?? "Professional shift"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatShiftWindow(shift.starts_at, shift.ends_at)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {shift.office_locations?.name ?? "Office location"} -{" "}
            {shift.office_locations?.city}, {shift.office_locations?.state}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <Badge variant={shift.status === "open" ? "default" : "outline"}>
            {formatStatus(shift.status)}
          </Badge>
          <span className="text-sm font-semibold text-teal-700">
            {formatRate(shift.hourly_rate_cents)}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {shift.interested_count} interested
          </span>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/office/shifts/${shift.id}`}>Review</Link>
            </Button>
            {shift.status === "draft" || shift.status === "open" ? (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/office/shifts/${shift.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
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

function formatShiftWindow(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles"
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  }).format(start);
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  }).format(end);

  return `${day}, ${startTime} - ${endTime}`;
}

function formatRate(rateCents: number | null) {
  return rateCents ? `$${Math.round(rateCents / 100)}/hr` : "Rate TBD";
}

function formatStatus(status: PostedShift["status"]) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
