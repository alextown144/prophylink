import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  UserRound
} from "lucide-react";
import Link from "next/link";
import {
  formatAvailabilityDate,
  formatTimeRange,
  parseWeeklyRecurrenceDays
} from "@/lib/availability";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AccountRole = {
  kind: "professional" | "office" | "admin";
  onboarding_completed_at: string | null;
};

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

type ProfessionalProfile = {
  id: string;
  professional_role_id: string;
  short_bio: string | null;
  years_experience: number | string | null;
  hourly_rate_cents: number | null;
  preferred_radius_miles: number | string | null;
};

type AvailabilityRule = {
  id: string;
  kind: "available" | "unavailable";
  starts_at: string | null;
  ends_at: string | null;
  recurrence_rule: string | null;
  recurrence_starts_on: string | null;
  recurrence_ends_on: string | null;
  notes: string | null;
};

type ProfessionalRole = {
  id: string;
  name: string;
  slug: string;
};

type BookingSummary = {
  id: string;
  agreed_ends_at: string;
  agreed_hourly_rate_cents: number | null;
  agreed_starts_at: string;
  status:
    | "invited"
    | "interested"
    | "requested"
    | "pending_office_approval"
    | "accepted"
    | "confirmed"
    | "declined"
    | "cancelled"
    | "completed";
};

type NotificationPreview = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
};

type CredentialSummary = {
  id: string;
  status: "pending" | "verified" | "rejected" | "expired";
  credential_types: {
    name: string;
  } | null;
};

export default async function ProfessionalDashboardPage() {
  const user = await requireUser();
  const {
    accountRoles,
    availabilityRules,
    bookingSummaries,
    credentialSummaries,
    notifications,
    profile,
    professionalProfile,
    professionalRole
  } = await getProfessionalDashboardData(user.id);
  const isAdmin = accountRoles.some((role) => role.kind === "admin");
  const professionalRoleRecord = accountRoles.find((role) => role.kind === "professional");
  const displayName = profile?.display_name || user.email || "there";
  const onboardingComplete = Boolean(professionalRoleRecord?.onboarding_completed_at);

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            Professional dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Welcome back, {firstName(displayName)}
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your beta profile foundation is connected to Supabase. Use this page
            to review what offices will eventually see and jump into the next
            setup tasks.
          </p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/professional/shifts">Browse shifts</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/professional/availability">Manage availability</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/professional/schedule">My schedule</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/professional/profile">Edit profile</Link>
          </Button>
          {isAdmin ? (
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusMetric
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Profile status"
          value={onboardingComplete ? "Complete" : "Needs setup"}
        />
        <StatusMetric
          icon={<UserRound className="h-5 w-5" />}
          label="Role"
          value={professionalRole?.name ?? "Not selected"}
        />
        <StatusMetric
          icon={<SlidersHorizontal className="h-5 w-5" />}
          label="Rate"
          value={formatRate(professionalProfile?.hourly_rate_cents)}
        />
        <StatusMetric
          icon={<CalendarDays className="h-5 w-5" />}
          label="Shift responses"
          value={String(bookingSummaries.length)}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Marketplace profile preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div>
              <p className="text-sm font-semibold text-slate-500">Name</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {profile?.display_name || "Add your name"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileFact label="Email" value={profile?.email} />
              <ProfileFact
                label="Location"
                value={formatLocation(profile?.city, profile?.state, profile?.postal_code)}
              />
              <ProfileFact label="Experience" value={formatYears(professionalProfile?.years_experience)} />
              <ProfileFact label="Launch role" value={professionalRole?.name} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Short bio</p>
              <p className="mt-2 rounded-lg bg-slate-50 p-4 leading-7 text-slate-700">
                {professionalProfile?.short_bio || "No bio saved yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              Beta readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ChecklistItem complete={Boolean(profile?.display_name)} label="Name saved" />
            <ChecklistItem complete={Boolean(professionalRole)} label="Professional role selected" />
            <ChecklistItem complete={Boolean(profile?.city && profile.state)} label="Location saved" />
            <ChecklistItem complete={Boolean(professionalProfile)} label="Profile foundation saved" />
            <ChecklistItem complete={availabilityRules.length > 0} label="Availability saved" />
            <ChecklistItem
              complete={credentialSummaries.some((credential) => credential.status === "verified")}
              label="Verified credential on file"
            />
            <NextStep
              href="/professional/shifts"
              label={
                bookingSummaries.some((booking) => booking.status === "accepted")
                  ? "Confirm accepted shift"
                  : "Browse open shifts"
              }
              text={
                bookingSummaries.some((booking) => booking.status === "accepted")
                  ? "An office accepted your interest. Confirm or decline the shift."
                  : "Review office-posted coverage needs and send interest."
              }
            />
            <NextStep
              href="/professional/availability"
              label="Manage availability calendar"
              text="Add individual dates or weekly repeating availability."
            />
            <NextStep
              href="/professional/profile"
              label="Update profile foundation"
              text="Change your public-safe bio, rate, radius, or location."
            />
            <NextStep
              href="/professional/credentials"
              label="Upload credentials"
              text="Submit license or certification documentation for admin review."
            />
            <NextStep
              href="/admin/users"
              label="Create another test invite"
              text="As admin, invite a clean professional test user for non-admin testing."
              show={isAdmin}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-700" />
              Shift responses
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {bookingSummaries.length > 0 ? (
              bookingSummaries.slice(0, 4).map((booking) => (
                <BookingPreview key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">No shift responses yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Browse open shifts and send interest when one fits your schedule.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/professional/shifts">Browse shifts</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-700" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {notifications.length > 0 ? (
              <>
                {notifications.slice(0, 4).map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
                <Button asChild variant="outline">
                  <Link href="/notifications">View all notifications</Link>
                </Button>
              </>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">No notifications yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Office selections and shift updates will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-700" />
              Availability preview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {availabilityRules.length > 0 ? (
              availabilityRules.slice(0, 4).map((rule) => (
                <AvailabilityPreview key={rule.id} rule={rule} />
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">No availability yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add a single date or repeating weekly rule so future matching can
                  find you for the right shifts.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/professional/availability">Add availability</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-700" />
              Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {credentialSummaries.length > 0 ? (
              credentialSummaries.slice(0, 4).map((credential) => (
                <div className="rounded-lg border bg-white p-4" key={credential.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">
                      {credential.credential_types?.name ?? "Credential"}
                    </p>
                    <Badge variant={credential.status === "verified" ? "default" : "outline"}>
                      {formatStatus(credential.status)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No credentials submitted yet.
              </p>
            )}
            <Button asChild variant="outline">
              <Link href="/professional/credentials">Manage credentials</Link>
            </Button>
          </CardContent>
        </Card>
        <FutureCard
          icon={<ArrowRight className="h-5 w-5" />}
          title="Matching workflow"
          text="Offices can now select available professionals; confirmation and completion are active."
        />
      </section>
    </main>
  );
}

async function getProfessionalDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [profileResult, rolesResult, professionalProfileResult, notificationsResult] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("first_name, last_name, display_name, email, city, state, postal_code")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("account_roles")
        .select("kind, onboarding_completed_at")
        .eq("user_id", userId),
      supabase
        .from("professional_profiles")
        .select(
          "id, professional_role_id, short_bio, years_experience, hourly_rate_cents, preferred_radius_miles"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select("id, type, title, body, created_at, read_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);
  const professionalProfile = professionalProfileResult.data as ProfessionalProfile | null;
  let professionalRole: ProfessionalRole | null = null;

  if (professionalProfile?.professional_role_id) {
    const { data } = await supabase
      .from("professional_roles")
      .select("id, name, slug")
      .eq("id", professionalProfile.professional_role_id)
      .maybeSingle();
    professionalRole = data as ProfessionalRole | null;
  }

  let availabilityRules: AvailabilityRule[] = [];
  let bookingSummaries: BookingSummary[] = [];
  let credentialSummaries: CredentialSummary[] = [];

  if (professionalProfile?.id) {
    const [availabilityResult, bookingResult, credentialResult] = await Promise.all([
      supabase
        .from("availability_rules")
        .select(
          "id, kind, starts_at, ends_at, recurrence_rule, recurrence_starts_on, recurrence_ends_on, notes"
        )
        .eq("professional_profile_id", professionalProfile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("bookings")
        .select("id, status, agreed_hourly_rate_cents, agreed_starts_at, agreed_ends_at")
        .eq("professional_profile_id", professionalProfile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("professional_credentials")
        .select("id, status, credential_types(name)")
        .eq("professional_profile_id", professionalProfile.id)
        .order("created_at", { ascending: false })
        .limit(6)
    ]);
    availabilityRules = (availabilityResult.data ?? []) as AvailabilityRule[];
    bookingSummaries = (bookingResult.data ?? []) as BookingSummary[];
    credentialSummaries = (credentialResult.data ?? []) as CredentialSummary[];
  }

  return {
    accountRoles: (rolesResult.data ?? []) as AccountRole[],
    availabilityRules,
    bookingSummaries,
    credentialSummaries,
    notifications: (notificationsResult.data ?? []) as NotificationPreview[],
    profile: profileResult.data as UserProfile | null,
    professionalProfile,
    professionalRole
  };
}

function BookingPreview({ booking }: { booking: BookingSummary }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-950">
          {formatShiftDate(booking.agreed_starts_at)}
        </p>
        <Badge variant={booking.status === "accepted" ? "default" : "outline"}>
          {formatStatus(booking.status)}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {formatShiftTime(booking.agreed_starts_at, booking.agreed_ends_at)} -{" "}
        {formatRate(booking.agreed_hourly_rate_cents)}
      </p>
      {booking.status === "accepted" ? (
        <Button asChild className="mt-4" size="sm">
          <Link href="/professional/shifts">Confirm or decline</Link>
        </Button>
      ) : null}
    </div>
  );
}

function AvailabilityPreview({ rule }: { rule: AvailabilityRule }) {
  const recurringDays = parseWeeklyRecurrenceDays(rule.recurrence_rule);
  const isRecurring = recurringDays.length > 0;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-950">
          {isRecurring
            ? `Every ${recurringDays.join(", ")}`
            : formatAvailabilityDate(rule.starts_at)}
        </p>
        <Badge variant={rule.kind === "available" ? "default" : "secondary"}>
          {rule.kind}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {formatTimeRange(rule.starts_at, rule.ends_at)}
      </p>
      {rule.notes ? <p className="mt-2 text-sm text-slate-600">{rule.notes}</p> : null}
    </div>
  );
}

function NotificationCard({ notification }: { notification: NotificationPreview }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-950">{notification.title}</p>
        <Badge variant={notification.read_at ? "outline" : "default"}>
          {notification.read_at ? "Read" : "New"}
        </Badge>
      </div>
      {notification.body ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p>
      ) : null}
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {formatNotificationDate(notification.created_at)}
      </p>
      {["shift_accepted", "shift_selected", "shift_cancelled", "shift_completed"].includes(
        notification.type
      ) ? (
        <Button asChild className="mt-4" size="sm">
          <Link href="/professional/shifts">Review shift</Link>
        </Button>
      ) : null}
    </div>
  );
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

function firstName(value: string) {
  return value.split(" ")[0] || value;
}

function formatRate(cents?: number | null) {
  return typeof cents === "number" ? `$${Math.round(cents / 100)}/hr` : "Not set";
}

function formatYears(value?: number | string | null) {
  return value ? `${value} years` : "Not saved";
}

function formatLocation(city?: string | null, state?: string | null, postalCode?: string | null) {
  return [city, state, postalCode].filter(Boolean).join(", ") || "Not saved";
}

function formatShiftDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatShiftTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
