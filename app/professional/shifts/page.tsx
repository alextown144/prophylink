import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { startBookingConversation } from "@/app/messages/actions";
import { hasBlockingBookingConflict } from "@/lib/booking-conflicts";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBookingStatus, getBookingNextAction } from "@/lib/booking-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { expressInterestInShift, respondToAcceptedShift } from "./actions";

type SearchParams = Promise<{
  interest?: string;
  response?: string;
}>;

type ProfessionalProfile = {
  id: string;
  professional_role_id: string;
};

type OpenShift = {
  id: string;
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
  organizations: {
    name: string;
  } | null;
  professional_roles: {
    id: string;
    name: string;
  } | null;
};

type OpenShiftWithConflict = OpenShift & {
  hasScheduleConflict: boolean;
};

type BookingInterest = {
  id: string;
  shift_id: string | null;
  cancelled_reason?: string | null;
  completed_at?: string | null;
  confirmed_at?: string | null;
  created_at?: string | null;
  agreed_hourly_rate_cents?: number | null;
  agreed_starts_at?: string;
  agreed_ends_at?: string;
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

export default async function ProfessionalShiftsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { interest, response } = await searchParams;
  const { bookingsByShiftId, myBookings, openShifts, professionalProfile } = await getShiftBoardData(
    user.id
  );

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
            Shift marketplace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Browse open shifts
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Review available office shifts and send interest when one fits your
            schedule.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/professional/availability">Manage availability</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/professional/schedule">My schedule</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/professional/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      {interest ? <InterestMessage status={interest} /> : null}
      {response ? <ResponseMessage status={response} /> : null}

      {!professionalProfile ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-slate-950">Profile setup needed</p>
            <p className="mt-2 leading-7 text-slate-600">
              Complete your professional profile before sending interest in shifts.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professional/profile">Finish professional profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {myBookings.length > 0 ? (
            <section className="mb-6">
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-semibold text-slate-950">Your shift responses</h2>
                  <div className="mt-4 grid gap-3">
                    {myBookings.map((booking) => (
                      <ResponseRow
                        booking={booking}
                        key={booking.id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section className="grid gap-4">
            {openShifts.length > 0 ? (
              openShifts.map((shift) => (
                <ShiftCard
                  booking={bookingsByShiftId.get(shift.id)}
                  hasScheduleConflict={shift.hasScheduleConflict}
                  isRoleMatch={
                    shift.professional_roles?.id === professionalProfile.professional_role_id
                  }
                  key={shift.id}
                  shift={shift}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold text-slate-950">No open shifts yet</p>
                  <p className="mt-2 leading-7 text-slate-600">
                    Office-posted shifts will appear here as soon as they are open.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </main>
  );
}

async function getShiftBoardData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: professionalProfileData } = await supabase
    .from("professional_profiles")
    .select("id, professional_role_id")
    .eq("user_id", userId)
    .maybeSingle();

  const professionalProfile = professionalProfileData as ProfessionalProfile | null;
  const [openShiftsResult, bookingsResult] = await Promise.all([
    supabase
      .from("shifts")
      .select(
        "id, starts_at, ends_at, hourly_rate_cents, unpaid_lunch_minutes, description, required_notes, dress_requirements, parking_instructions, arrival_instructions, office_locations(name, address_line1, city, state, postal_code), organizations(name), professional_roles(id, name)"
      )
      .eq("status", "open")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    professionalProfile
        ? supabase
          .from("bookings")
          .select(
            "id, shift_id, cancelled_reason, completed_at, confirmed_at, created_at, status, agreed_hourly_rate_cents, agreed_starts_at, agreed_ends_at"
          )
          .eq("professional_profile_id", professionalProfile.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const bookings = (bookingsResult.data ?? []) as BookingInterest[];
  const bookingsByShiftId = new Map<string, BookingInterest>();
  const blockingBookings = bookings.filter(
    (booking): booking is BookingInterest & {
      agreed_ends_at: string;
      agreed_starts_at: string;
    } => Boolean(booking.agreed_starts_at && booking.agreed_ends_at)
  );

  bookings.forEach((booking) => {
    if (booking.shift_id) {
      bookingsByShiftId.set(booking.shift_id, booking);
    }
  });

  return {
    bookingsByShiftId,
    myBookings: bookings,
    openShifts: ((openShiftsResult.data ?? []) as OpenShift[]).map((shift) => ({
      ...shift,
      hasScheduleConflict: hasBlockingBookingConflict(blockingBookings, {
        ends_at: shift.ends_at,
        starts_at: shift.starts_at
      })
    })),
    professionalProfile
  };
}

function ResponseRow({ booking }: { booking: BookingInterest }) {
  const canMessage = ["accepted", "confirmed"].includes(booking.status);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-slate-950">
            {booking.agreed_starts_at && booking.agreed_ends_at
              ? formatShiftTime(booking.agreed_starts_at, booking.agreed_ends_at)
              : "Shift response"}
          </p>
          {booking.agreed_starts_at ? (
            <p className="mt-1 text-sm text-slate-600">
              {formatShiftDate(booking.agreed_starts_at)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={booking.status === "accepted" ? "default" : "outline"}>
            {formatBookingStatus(booking.status)}
          </Badge>
          <span className="text-sm font-semibold text-teal-700">
            {formatRate(booking.agreed_hourly_rate_cents ?? null)}
          </span>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        {getBookingNextAction(booking.status, "professional")}
      </p>
      {booking.shift_id && (booking.status === "accepted" || canMessage) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {booking.status === "accepted" ? (
            <>
              <form action={respondToAcceptedShift}>
                <input name="booking_id" type="hidden" value={booking.id} />
                <input name="shift_id" type="hidden" value={booking.shift_id} />
                <input name="action" type="hidden" value="confirm" />
                <Button size="sm" type="submit">
                  Confirm shift
                </Button>
              </form>
              <form action={respondToAcceptedShift}>
                <input name="booking_id" type="hidden" value={booking.id} />
                <input name="shift_id" type="hidden" value={booking.shift_id} />
                <input name="action" type="hidden" value="decline" />
                <Button size="sm" type="submit" variant="outline">
                  Decline
                </Button>
              </form>
            </>
          ) : null}
          {canMessage ? (
            <form action={startBookingConversation}>
              <input name="booking_id" type="hidden" value={booking.id} />
              <Button size="sm" type="submit" variant="outline">
                Message office
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ShiftCard({
  booking,
  hasScheduleConflict,
  isRoleMatch,
  shift
}: {
  booking?: BookingInterest;
  hasScheduleConflict: boolean;
  isRoleMatch: boolean;
  shift: OpenShiftWithConflict;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_14rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isRoleMatch ? <Badge>Role match</Badge> : null}
              <Badge variant="secondary">{shift.professional_roles?.name ?? "Shift"}</Badge>
              <span className="text-sm font-semibold text-teal-700">
                {formatRate(shift.hourly_rate_cents)}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              {shift.organizations?.name ?? "Dental office"}
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <IconFact
                icon={<CalendarDays className="h-4 w-4" />}
                text={formatShiftDate(shift.starts_at)}
              />
              <IconFact
                icon={<Clock className="h-4 w-4" />}
                text={formatShiftTime(shift.starts_at, shift.ends_at)}
              />
              <IconFact
                icon={<Building2 className="h-4 w-4" />}
                text={shift.office_locations?.name ?? "Office location"}
              />
              <IconFact
                icon={<MapPin className="h-4 w-4" />}
                text={formatAddress(shift)}
              />
            </div>
            <DetailBlock label="Description" value={shift.description} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailBlock label="Required notes" value={shift.required_notes} />
              <DetailBlock label="Dress" value={shift.dress_requirements} />
              <DetailBlock label="Parking" value={shift.parking_instructions} />
              <DetailBlock label="Arrival" value={shift.arrival_instructions} />
            </div>
          </div>
          <div className="grid content-start gap-4">
            {shift.unpaid_lunch_minutes ? (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Lunch</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {shift.unpaid_lunch_minutes} unpaid min
                </p>
              </div>
            ) : null}
            {booking ? (
              <div className="rounded-lg border bg-white p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Interest sent
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {formatBookingStatus(booking.status)}
                </p>
              </div>
            ) : (
              <>
                {hasScheduleConflict ? (
                  <div className="rounded-lg border bg-white p-3">
                    <p className="text-sm font-semibold text-slate-950">
                      Conflicts with your schedule
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      You already have an accepted or confirmed shift during this time.
                    </p>
                  </div>
                ) : (
                  <form action={expressInterestInShift}>
                    <input name="shift_id" type="hidden" value={shift.id} />
                    <Button className="w-full" type="submit">
                      I&apos;m interested
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InterestMessage({ status }: { status: string }) {
  const message =
    {
      already_sent: "You already sent interest for that shift.",
      failed: "Interest could not be sent. Try again.",
      conflict: "That shift conflicts with an accepted or confirmed shift already on your schedule.",
      plan_required: "Your current professional plan does not include sending shift interest.",
      profile_required: "Complete your professional profile before sending interest.",
      sent: "Interest sent. The office can now see your response.",
      service_required: "Server configuration is required before interest can be sent.",
      unavailable: "That shift is no longer open."
    }[status] ?? "Shift board updated.";

  return (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  );
}

function ResponseMessage({ status }: { status: string }) {
  const message =
    {
      confirmed: "Shift confirmed. The office will see this as filled.",
      declined: "Shift declined. The posting was reopened for the office.",
      failed: "Shift response could not be saved. Try again.",
      conflict: "That shift conflicts with another accepted or confirmed shift on your schedule.",
      profile_required: "Complete your professional profile before responding.",
      service_required: "Server configuration is required before confirming shifts.",
      unavailable: "That accepted shift is no longer available."
    }[status] ?? null;

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
    <div className="mt-4">
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

function formatAddress(shift: OpenShift) {
  const location = shift.office_locations;

  if (!location) {
    return "Location not shown";
  }

  return `${location.address_line1}, ${location.city}, ${location.state} ${location.postal_code}`;
}

function formatRate(rateCents: number | null) {
  return rateCents ? `$${Math.round(rateCents / 100)}/hr` : "Rate TBD";
}
