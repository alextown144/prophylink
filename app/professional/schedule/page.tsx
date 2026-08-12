import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { startBookingConversation } from "@/app/messages/actions";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBookingStatus, getBookingNextAction } from "@/lib/booking-status";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfessionalProfile = {
  id: string;
};

type ScheduleBooking = {
  id: string;
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
  organizations: {
    name: string;
  } | null;
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

export default async function ProfessionalSchedulePage() {
  const user = await requireUser();
  const { bookings, professionalProfile } = await getProfessionalScheduleData(user.id);
  const activeBookings = bookings.filter((booking) =>
    ["accepted", "confirmed"].includes(booking.status)
  );
  const historyBookings = bookings.filter(
    (booking) => !["accepted", "confirmed"].includes(booking.status)
  );

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
            My schedule
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Upcoming shift commitments
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Accepted and confirmed shifts block your marketplace availability so
            you do not get double-booked.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/professional/shifts">Browse shifts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/messages">Messages</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/professional/availability">Availability</Link>
          </Button>
        </div>
      </div>

      {!professionalProfile ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold text-slate-950">Profile setup needed</p>
            <p className="mt-2 leading-7 text-slate-600">
              Complete your professional profile before shift commitments can appear.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professional/profile">Finish profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Active commitments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {activeBookings.length > 0 ? (
                activeBookings.map((booking) => (
                  <ScheduleBookingCard booking={booking} key={booking.id} />
                ))
              ) : (
                <EmptyState
                  title="No active commitments"
                  text="Accepted and confirmed shifts will appear here."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent responses</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {historyBookings.length > 0 ? (
                historyBookings.slice(0, 8).map((booking) => (
                  <ScheduleBookingCard booking={booking} key={booking.id} compact />
                ))
              ) : (
                <EmptyState
                  title="No response history yet"
                  text="Declined, completed, and cancelled responses will appear here."
                />
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}

async function getProfessionalScheduleData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: professionalProfileData } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const professionalProfile = professionalProfileData as ProfessionalProfile | null;

  if (!professionalProfile) {
    return { bookings: [] as ScheduleBooking[], professionalProfile: null };
  }

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, cancelled_reason, completed_at, confirmed_at, created_at, status, agreed_starts_at, agreed_ends_at, agreed_hourly_rate_cents, organizations(name), office_locations(name, address_line1, city, state, postal_code), professional_roles(name)"
    )
    .eq("professional_profile_id", professionalProfile.id)
    .gte("agreed_ends_at", new Date().toISOString())
    .order("agreed_starts_at", { ascending: true })
    .limit(30);

  return {
    bookings: (data ?? []) as ScheduleBooking[],
    professionalProfile
  };
}

function ScheduleBookingCard({
  booking,
  compact = false
}: {
  booking: ScheduleBooking;
  compact?: boolean;
}) {
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
          <h2 className="mt-3 font-semibold text-slate-950">
            {booking.organizations?.name ?? "Dental office"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/professional/shifts">Review</Link>
          </Button>
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
          {getBookingNextAction(booking.status, "professional")}
        </p>
      ) : (
        <BookingStatusTimeline audience="professional" booking={booking} className="mt-4" />
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

function formatAddress(booking: ScheduleBooking) {
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
