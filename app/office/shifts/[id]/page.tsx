import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptInterestedProfessional } from "@/app/office/shifts/actions";
import { getOfficeOrganizationId } from "@/app/office/shifts/data";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    selection?: string;
    updated?: string;
  }>;
};

type OfficeShiftDetail = {
  id: string;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
  unpaid_lunch_minutes: number | null;
  description: string | null;
  required_notes: string | null;
  dress_requirements: string | null;
  parking_instructions: string | null;
  arrival_instructions: string | null;
  office_locations: {
    name: string | null;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
  } | null;
  professional_roles: {
    name: string;
  } | null;
};

type ShiftBooking = {
  id: string;
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
  created_at: string;
  agreed_hourly_rate_cents: number | null;
  professional_profiles: {
    hourly_rate_cents: number | null;
    preferred_radius_miles: number | string | null;
    short_bio: string | null;
    years_experience: number | string | null;
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
};

export default async function OfficeShiftDetailPage({
  params,
  searchParams
}: PageProps) {
  const user = await requireUser();
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const { bookings, shift } = await getOfficeShiftDetail(user.id, id);

  if (!shift) {
    notFound();
  }

  const canEdit = shift.status === "draft" || shift.status === "open";

  return (
    <main className="container py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/office/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Office dashboard
            </Link>
          </Button>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Shift details</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Review the posting and choose an interested professional.
          </p>
        </div>
        {canEdit ? (
          <Button asChild>
            <Link href={`/office/shifts/${shift.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit shift
            </Link>
          </Button>
        ) : null}
      </div>

      <StatusMessage selection={messages.selection} updated={messages.updated} />

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{shift.professional_roles?.name ?? "Shift"}</span>
              <Badge variant={shift.status === "open" ? "default" : "outline"}>
                {formatStatus(shift.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <IconFact
                icon={<CalendarDays className="h-4 w-4" />}
                text={formatShiftDate(shift.starts_at)}
              />
              <IconFact
                icon={<Clock className="h-4 w-4" />}
                text={formatShiftTime(shift.starts_at, shift.ends_at)}
              />
              <IconFact icon={<MapPin className="h-4 w-4" />} text={formatAddress(shift)} />
              <IconFact
                icon={<CheckCircle2 className="h-4 w-4" />}
                text={formatRate(shift.hourly_rate_cents)}
              />
            </div>
            <DetailBlock label="Description" value={shift.description} />
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBlock label="Required notes" value={shift.required_notes} />
              <DetailBlock label="Dress" value={shift.dress_requirements} />
              <DetailBlock label="Parking" value={shift.parking_instructions} />
              <DetailBlock label="Arrival" value={shift.arrival_instructions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interested professionals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <InterestedProfessionalCard
                  booking={booking}
                  key={booking.id}
                  shiftId={shift.id}
                />
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">No interest yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Professionals who tap I&apos;m interested will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getOfficeShiftDetail(userId: string, shiftId: string) {
  const organizationId = await getOfficeOrganizationId(userId);

  if (!organizationId) {
    return { bookings: [], shift: null };
  }

  const supabase = await createSupabaseServerClient();
  const [shiftResult, bookingsResult] = await Promise.all([
    supabase
      .from("shifts")
      .select(
        "id, status, starts_at, ends_at, hourly_rate_cents, unpaid_lunch_minutes, description, required_notes, dress_requirements, parking_instructions, arrival_instructions, office_locations(name, address_line1, city, state, postal_code), professional_roles(name)"
      )
      .eq("id", shiftId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id, status, created_at, agreed_hourly_rate_cents, professional_profiles(hourly_rate_cents, preferred_radius_miles, short_bio, years_experience, user_profiles(display_name, email, city, state), professional_roles(name))"
      )
      .eq("shift_id", shiftId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true })
  ]);

  return {
    bookings: (bookingsResult.data ?? []) as ShiftBooking[],
    shift: shiftResult.data as OfficeShiftDetail | null
  };
}

function InterestedProfessionalCard({
  booking,
  shiftId
}: {
  booking: ShiftBooking;
  shiftId: string;
}) {
  const profile = booking.professional_profiles;
  const userProfile = profile?.user_profiles;
  const canAccept = booking.status === "interested";
  const displayName = userProfile?.display_name ?? "Professional";
  const profileFacts = [
    ["Role", profile?.professional_roles?.name],
    ["Location", formatProfessionalLocation(userProfile?.city, userProfile?.state)],
    ["Email", userProfile?.email],
    ["Experience", formatYears(profile?.years_experience)],
    ["Profile rate", formatRate(profile?.hourly_rate_cents)],
    ["Shift response rate", formatRate(booking.agreed_hourly_rate_cents)],
    ["Preferred radius", formatRadius(profile?.preferred_radius_miles)]
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <UserRound className="h-4 w-4 text-teal-700" />
            {displayName}
          </p>
          {profile?.professional_roles?.name ? (
            <p className="mt-1 text-sm font-semibold text-teal-700">
              {profile.professional_roles.name}
            </p>
          ) : null}
        </div>
        <Badge variant={booking.status === "accepted" ? "default" : "outline"}>
          {formatStatus(booking.status)}
        </Badge>
      </div>
      {profileFacts.length > 0 ? (
        <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
          {profileFacts.map(([label, value]) => (
            <div key={label}>
              <dt className="font-semibold text-slate-500">{label}</dt>
              <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Professional profile details are not available yet.
        </p>
      )}
      {profile?.short_bio ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-slate-500">Bio</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{profile.short_bio}</p>
        </div>
      ) : null}
      {canAccept ? (
        <form action={acceptInterestedProfessional} className="mt-4">
          <input name="booking_id" type="hidden" value={booking.id} />
          <input name="shift_id" type="hidden" value={shiftId} />
          <Button type="submit">Accept professional</Button>
        </form>
      ) : null}
    </div>
  );
}

function StatusMessage({
  selection,
  updated
}: {
  selection?: string;
  updated?: string;
}) {
  const message =
    updated === "1"
      ? "Shift updated."
      : {
          accepted: "Professional accepted. Other interested responses were declined.",
          failed: "Professional could not be accepted. Try again.",
          service_required: "Server configuration is required before accepting professionals.",
          unavailable: "That interest response is no longer available."
        }[selection ?? ""];

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function IconFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

function DetailBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function formatShiftDate(startsAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "America/Los_Angeles"
  }).format(new Date(startsAt));
}

function formatShiftTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

function formatAddress(shift: OfficeShiftDetail) {
  const location = shift.office_locations;

  if (!location) {
    return "Location not shown";
  }

  return `${location.name ?? "Office location"} - ${location.address_line1}, ${location.city}, ${location.state} ${location.postal_code}`;
}

function formatRate(rateCents?: number | null) {
  return rateCents ? `$${Math.round(rateCents / 100)}/hr` : "Rate TBD";
}

function formatProfessionalLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ") || null;
}

function formatYears(value?: number | string | null) {
  return value ? `${value} years` : null;
}

function formatRadius(value?: number | string | null) {
  return value ? `${value} miles` : null;
}

function formatStatus(status: OfficeShiftDetail["status"] | ShiftBooking["status"]) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
