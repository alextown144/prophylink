import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { startBookingConversation } from "@/app/messages/actions";
import { expressInterestInShift, respondToAcceptedShift } from "@/app/professional/shifts/actions";
import { hasBlockingBookingConflict } from "@/lib/booking-conflicts";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { formatBookingStatus, getBookingNextAction } from "@/lib/booking-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    interest?: string;
    response?: string;
  }>;
};

type ProfessionalProfile = {
  id: string;
  professional_role_id: string;
};

type ProfessionalShiftDetail = {
  id: string;
  professional_role_id: string;
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

type ProfessionalBooking = {
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
  agreed_hourly_rate_cents: number | null;
  agreed_starts_at: string;
  agreed_ends_at: string;
};

type BlockingBooking = {
  id: string;
  agreed_starts_at: string;
  agreed_ends_at: string;
  status: string;
};

export default async function ProfessionalShiftDetailPage({
  params,
  searchParams
}: PageProps) {
  const user = await requireUser();
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const { booking, hasScheduleConflict, professionalProfile, shift } =
    await getProfessionalShiftDetail(user.id, id);

  if (!shift && professionalProfile) {
    notFound();
  }

  const roleMatch =
    Boolean(professionalProfile) &&
    shift?.professional_role_id === professionalProfile?.professional_role_id;

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href="/professional/shifts">
              <ArrowLeft className="h-4 w-4" />
              Browse shifts
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Shift review
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {shift?.organizations?.name ?? "Shift details"}
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Review the office, schedule, and current booking status before taking action.
          </p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/professional/schedule">My schedule</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/professional/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      {messages.interest ? <InterestMessage status={messages.interest} /> : null}
      {messages.response ? <ResponseMessage status={messages.response} /> : null}

      {!professionalProfile ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-slate-950">Profile setup needed</p>
            <p className="mt-2 leading-7 text-slate-600">
              Complete your professional profile before reviewing shift details.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professional/profile">Finish professional profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : shift ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>{shift.professional_roles?.name ?? "Shift"}</span>
                <div className="flex flex-wrap gap-2">
                  {roleMatch ? <Badge>Role match</Badge> : null}
                  <Badge variant={shift.status === "open" ? "default" : "outline"}>
                    {formatShiftStatus(shift.status)}
                  </Badge>
                </div>
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
                <IconFact
                  icon={<Building2 className="h-4 w-4" />}
                  text={shift.office_locations?.name ?? "Office location"}
                />
                <IconFact icon={<MapPin className="h-4 w-4" />} text={formatAddress(shift)} />
                <IconFact
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  text={formatRate(shift.hourly_rate_cents)}
                />
              </div>

              {shift.unpaid_lunch_minutes ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Lunch</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {shift.unpaid_lunch_minutes} unpaid min
                  </p>
                </div>
              ) : null}

              <DetailBlock label="Description" value={shift.description} />
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Required notes" value={shift.required_notes} />
                <DetailBlock label="Dress" value={shift.dress_requirements} />
                <DetailBlock label="Parking" value={shift.parking_instructions} />
                <DetailBlock label="Arrival" value={shift.arrival_instructions} />
              </div>
            </CardContent>
          </Card>

          <BookingActionCard
            booking={booking}
            hasScheduleConflict={hasScheduleConflict}
            shift={shift}
          />
        </section>
      ) : null}
    </main>
  );
}

async function getProfessionalShiftDetail(userId: string, shiftId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: professionalProfileData } = await supabase
    .from("professional_profiles")
    .select("id, professional_role_id")
    .eq("user_id", userId)
    .maybeSingle();
  const professionalProfile = professionalProfileData as ProfessionalProfile | null;

  if (!professionalProfile) {
    return {
      booking: null,
      hasScheduleConflict: false,
      professionalProfile: null,
      shift: null
    };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      booking: null,
      hasScheduleConflict: false,
      professionalProfile,
      shift: null
    };
  }

  const readClient = createSupabaseAdminClient();
  const [shiftResult, bookingResult, blockingBookingsResult] = await Promise.all([
    readClient
      .from("shifts")
      .select(
        "id, professional_role_id, status, starts_at, ends_at, hourly_rate_cents, unpaid_lunch_minutes, description, required_notes, dress_requirements, parking_instructions, arrival_instructions, organizations(name), office_locations(name, address_line1, city, state, postal_code), professional_roles(name)"
      )
      .eq("id", shiftId)
      .maybeSingle(),
    readClient
      .from("bookings")
      .select(
        "id, shift_id, cancelled_reason, completed_at, confirmed_at, created_at, status, agreed_hourly_rate_cents, agreed_starts_at, agreed_ends_at"
      )
      .eq("shift_id", shiftId)
      .eq("professional_profile_id", professionalProfile.id)
      .maybeSingle(),
    readClient
      .from("bookings")
      .select("id, agreed_starts_at, agreed_ends_at, status")
      .eq("professional_profile_id", professionalProfile.id)
      .in("status", ["accepted", "confirmed"])
  ]);
  const shift = shiftResult.data as ProfessionalShiftDetail | null;
  const booking = bookingResult.data as ProfessionalBooking | null;

  if (!shift) {
    return {
      booking,
      hasScheduleConflict: false,
      professionalProfile,
      shift: null
    };
  }

  const isOpenFutureShift =
    shift.status === "open" && new Date(shift.starts_at).getTime() >= Date.now();
  const canViewShift = isOpenFutureShift || Boolean(booking);

  if (!canViewShift) {
    return {
      booking,
      hasScheduleConflict: false,
      professionalProfile,
      shift: null
    };
  }

  const blockingBookings = ((blockingBookingsResult.data ?? []) as BlockingBooking[]).filter(
    (blockingBooking) => blockingBooking.id !== booking?.id
  );

  return {
    booking,
    hasScheduleConflict: hasBlockingBookingConflict(blockingBookings, {
      ends_at: shift.ends_at,
      starts_at: shift.starts_at
    }),
    professionalProfile,
    shift
  };
}

function BookingActionCard({
  booking,
  hasScheduleConflict,
  shift
}: {
  booking: ProfessionalBooking | null;
  hasScheduleConflict: boolean;
  shift: ProfessionalShiftDetail;
}) {
  const canMessage = booking && ["accepted", "confirmed"].includes(booking.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your response</CardTitle>
      </CardHeader>
      <CardContent>
        {booking ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={booking.status === "accepted" ? "default" : "outline"}>
                {formatBookingStatus(booking.status)}
              </Badge>
              <span className="text-sm font-semibold text-teal-700">
                {formatRate(booking.agreed_hourly_rate_cents)}
              </span>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              {getBookingNextAction(booking.status, "professional")}
            </p>
            <BookingStatusTimeline audience="professional" booking={booking} className="mt-4" />

            <div className="mt-4 grid gap-2">
              {booking.status === "accepted" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={respondToAcceptedShift}>
                    <input name="booking_id" type="hidden" value={booking.id} />
                    <input name="shift_id" type="hidden" value={shift.id} />
                    <input name="action" type="hidden" value="confirm" />
                    <Button className="w-full" type="submit">
                      Confirm shift
                    </Button>
                  </form>
                  <form action={respondToAcceptedShift}>
                    <input name="booking_id" type="hidden" value={booking.id} />
                    <input name="shift_id" type="hidden" value={shift.id} />
                    <input name="action" type="hidden" value="decline" />
                    <Button className="w-full" type="submit" variant="outline">
                      Decline
                    </Button>
                  </form>
                </div>
              ) : null}
              {canMessage ? (
                <form action={startBookingConversation}>
                  <input name="booking_id" type="hidden" value={booking.id} />
                  <Button className="w-full" type="submit" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                    Message office
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        ) : shift.status !== "open" ? (
          <EmptyAction
            title="Shift is not open"
            text="This posting is no longer accepting new professional responses."
          />
        ) : hasScheduleConflict ? (
          <EmptyAction
            title="Conflicts with your schedule"
            text="You already have an accepted or confirmed shift during this time."
          />
        ) : (
          <div>
            <p className="font-semibold text-slate-950">Interested in this shift?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Send your interest to the office. They can review your profile and select
              you if it is a fit.
            </p>
            <form action={expressInterestInShift} className="mt-4">
              <input name="shift_id" type="hidden" value={shift.id} />
              <Button className="w-full" type="submit">
                I&apos;m interested
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyAction({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function StatusMessage({
  interest,
  response
}: {
  interest?: string;
  response?: string;
}) {
  const message =
    interestMessage(interest) ??
    responseMessage(response);

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function InterestMessage({ status }: { status: string }) {
  return <StatusMessage interest={status} />;
}

function ResponseMessage({ status }: { status: string }) {
  return <StatusMessage response={status} />;
}

function interestMessage(status?: string) {
  return (
    {
      already_sent: "You already sent interest for that shift.",
      failed: "Interest could not be sent. Try again.",
      conflict:
        "That shift conflicts with an accepted or confirmed shift already on your schedule.",
      plan_required: "Your current professional plan does not include sending shift interest.",
      profile_required: "Complete your professional profile before sending interest.",
      sent: "Interest sent. The office can now see your response.",
      service_required: "Server configuration is required before interest can be sent.",
      unavailable: "That shift is no longer open."
    }[status ?? ""] ?? null
  );
}

function responseMessage(status?: string) {
  return (
    {
      confirmed: "Shift confirmed. The office will see this as filled.",
      declined: "Shift declined. The posting was reopened for the office.",
      failed: "Shift response could not be saved. Try again.",
      conflict: "That shift conflicts with another accepted or confirmed shift on your schedule.",
      profile_required: "Complete your professional profile before responding.",
      service_required: "Server configuration is required before confirming shifts.",
      unavailable: "That accepted shift is no longer available."
    }[status ?? ""] ?? null
  );
}

function IconFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-teal-700">{icon}</span>
      <span className="min-w-0 break-words">{text}</span>
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

function formatAddress(shift: ProfessionalShiftDetail) {
  const location = shift.office_locations;

  if (!location) {
    return "Location not shown";
  }

  return `${location.address_line1}, ${location.city}, ${location.state} ${location.postal_code}`;
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

function formatShiftStatus(status: ProfessionalShiftDetail["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatShiftTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}
