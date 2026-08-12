import { ArrowLeft, CalendarDays, Clock, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { startBookingConversation } from "@/app/messages/actions";
import { getOfficeOrganizationId } from "@/app/office/shifts/data";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBookingStatus, getBookingNextAction } from "@/lib/booking-status";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OfficeScheduleBooking = {
  id: string;
  shift_id: string | null;
  cancelled_reason: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
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
  agreed_starts_at: string;
  agreed_ends_at: string;
  agreed_hourly_rate_cents: number | null;
  office_locations: {
    name: string | null;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
  } | null;
  professional_profiles: {
    user_profiles: {
      display_name: string | null;
      email: string;
    } | null;
    professional_roles: {
      name: string;
    } | null;
  } | null;
};

export default async function OfficeSchedulePage() {
  const user = await requireUser();
  const bookings = await getOfficeScheduleData(user.id);
  const pendingBookings = bookings.filter((booking) => booking.status === "accepted");
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const otherBookings = bookings.filter(
    (booking) => !["accepted", "confirmed"].includes(booking.status)
  );

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href="/office/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Office dashboard
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Office schedule
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Booked and pending coverage
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Track professionals selected for shifts, pending confirmations, and
            confirmed coverage across your locations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/office/shifts/new">Post a shift</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/messages">Messages</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/office/dashboard">Posted shifts</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Confirmed coverage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {confirmedBookings.length > 0 ? (
              confirmedBookings.map((booking) => (
                <OfficeScheduleBookingCard booking={booking} key={booking.id} />
              ))
            ) : (
              <EmptyState
                title="No confirmed coverage yet"
                text="Professionals who confirm accepted shifts will appear here."
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending confirmation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {pendingBookings.length > 0 ? (
                pendingBookings.map((booking) => (
                  <OfficeScheduleBookingCard booking={booking} key={booking.id} compact />
                ))
              ) : (
                <EmptyState
                  title="No pending confirmations"
                  text="Accepted professionals waiting to confirm will appear here."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent completed or cancelled</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {otherBookings.length > 0 ? (
                otherBookings.slice(0, 8).map((booking) => (
                  <OfficeScheduleBookingCard booking={booking} key={booking.id} compact />
                ))
              ) : (
                <EmptyState
                  title="No history yet"
                  text="Completed, cancelled, and declined bookings will appear here."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

async function getOfficeScheduleData(userId: string) {
  const organizationId = await getOfficeOrganizationId(userId);

  if (!organizationId) {
    return [] as OfficeScheduleBooking[];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, shift_id, cancelled_reason, completed_at, confirmed_at, created_at, status, agreed_starts_at, agreed_ends_at, agreed_hourly_rate_cents, office_locations(name, address_line1, city, state, postal_code), professional_profiles(user_profiles(display_name, email), professional_roles(name))"
    )
    .eq("organization_id", organizationId)
    .in("status", ["accepted", "confirmed", "completed", "cancelled", "declined"])
    .order("agreed_starts_at", { ascending: true })
    .limit(40);

  return (data ?? []) as OfficeScheduleBooking[];
}

function OfficeScheduleBookingCard({
  booking,
  compact = false
}: {
  booking: OfficeScheduleBooking;
  compact?: boolean;
}) {
  const profile = booking.professional_profiles;
  const userProfile = profile?.user_profiles;
  const canMessage = ["accepted", "confirmed"].includes(booking.status);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
              {formatBookingStatus(booking.status)}
            </Badge>
            <span className="text-sm font-semibold text-teal-700">
              {formatRate(booking.agreed_hourly_rate_cents)}
            </span>
          </div>
          <h2 className="mt-3 flex items-center gap-2 font-semibold text-slate-950">
            <UserRound className="h-4 w-4 text-teal-700" />
            {userProfile?.display_name ?? userProfile?.email ?? "Professional"}
          </h2>
          {profile?.professional_roles?.name ? (
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {profile.professional_roles.name}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {booking.shift_id ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/office/shifts/${booking.shift_id}`}>Review</Link>
            </Button>
          ) : null}
          {canMessage ? (
            <form action={startBookingConversation}>
              <input name="booking_id" type="hidden" value={booking.id} />
              <Button size="sm" type="submit">
                Message
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600">
        <IconFact icon={<CalendarDays className="h-4 w-4" />} text={formatShiftDate(booking.agreed_starts_at)} />
        <IconFact
          icon={<Clock className="h-4 w-4" />}
          text={formatShiftTime(booking.agreed_starts_at, booking.agreed_ends_at)}
        />
        {!compact ? (
          <IconFact
            icon={<MapPin className="h-4 w-4" />}
            text={formatAddress(booking)}
          />
        ) : null}
      </div>
      {compact ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {getBookingNextAction(booking.status, "office")}
        </p>
      ) : (
        <BookingStatusTimeline audience="office" booking={booking} className="mt-4" />
      )}
    </div>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function IconFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

function formatAddress(booking: OfficeScheduleBooking) {
  const location = booking.office_locations;

  if (!location) {
    return "Location not shown";
  }

  return `${location.name ?? "Office location"} - ${location.address_line1}, ${location.city}, ${location.state} ${location.postal_code}`;
}

function formatRate(rateCents: number | null) {
  return rateCents ? `$${Math.round(rateCents / 100)}/hr` : "Rate TBD";
}

function formatShiftDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
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
