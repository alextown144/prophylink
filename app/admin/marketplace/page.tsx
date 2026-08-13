import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  MessageSquareText,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShiftRow = {
  id: string;
  organization_id: string;
  office_location_id: string;
  professional_role_id: string;
  status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
  created_at: string;
};

type BookingRow = {
  id: string;
  shift_id: string | null;
  organization_id: string;
  office_location_id: string;
  professional_profile_id: string;
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
  created_at: string;
  updated_at: string;
};

type ConversationRow = {
  id: string;
  shift_id: string | null;
  booking_id: string | null;
  updated_at: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
};

type LocationRow = {
  id: string;
  name: string | null;
  city: string;
  state: string;
};

type ProfessionalRoleRow = {
  id: string;
  name: string;
};

type ProfessionalProfileRow = {
  id: string;
  user_id: string;
  professional_role_id: string;
};

type UserProfileRow = {
  id: string;
  display_name: string | null;
  email: string;
};

export default async function AdminMarketplacePage() {
  await requireAdmin();
  const data = await getAdminMarketplaceData();

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
            Marketplace visibility
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Shift, booking, and message activity
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Read-only operational view for beta testing. Use it to confirm that
            posted shifts, professional responses, bookings, messages, and
            notifications are flowing.
          </p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/admin/credentials">Credential review</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/admin/users">Users</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<CalendarDays className="h-5 w-5" />} label="Open shifts" value={String(data.metrics.openShifts)} />
        <Metric icon={<BriefcaseBusiness className="h-5 w-5" />} label="Active bookings" value={String(data.metrics.activeBookings)} />
        <Metric icon={<MessageSquareText className="h-5 w-5" />} label="Conversations" value={String(data.metrics.conversations)} />
        <Metric icon={<Bell className="h-5 w-5" />} label="Unread notifications" value={String(data.metrics.unreadNotifications)} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent shifts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.shifts.length > 0 ? (
              data.shifts.map((shift) => (
                <ShiftCard
                  bookings={data.bookingsByShiftId.get(shift.id) ?? []}
                  key={shift.id}
                  location={data.locationById.get(shift.office_location_id)}
                  organization={data.organizationById.get(shift.organization_id)}
                  role={data.roleById.get(shift.professional_role_id)}
                  shift={shift}
                />
              ))
            ) : (
              <EmptyState text="No posted shifts yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent bookings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.bookings.length > 0 ? (
              data.bookings.map((booking) => (
                <BookingCard
                  booking={booking}
                  key={booking.id}
                  location={data.locationById.get(booking.office_location_id)}
                  organization={data.organizationById.get(booking.organization_id)}
                  professional={data.professionalById.get(booking.professional_profile_id)}
                  roleById={data.roleById}
                  userById={data.userById}
                />
              ))
            ) : (
              <EmptyState text="No booking activity yet." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Message activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.conversations.length > 0 ? (
              data.conversations.map((conversation) => (
                <ConversationCard
                  conversation={conversation}
                  key={conversation.id}
                  latestMessage={data.latestMessageByConversationId.get(conversation.id)}
                  senderById={data.userById}
                />
              ))
            ) : (
              <EmptyState text="No booking conversations yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.notifications.length > 0 ? (
              data.notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  user={data.userById.get(notification.user_id)}
                />
              ))
            ) : (
              <EmptyState text="No notifications have been sent yet." />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

async function getAdminMarketplaceData() {
  const supabase = createSupabaseAdminClient();
  const [
    openShiftsResult,
    activeBookingsResult,
    conversationsCountResult,
    unreadNotificationsResult,
    shiftsResult,
    bookingsResult,
    conversationsResult,
    notificationsResult
  ] = await Promise.all([
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["accepted", "confirmed"]),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("shifts")
      .select(
        "id, organization_id, office_location_id, professional_role_id, status, starts_at, ends_at, hourly_rate_cents, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("bookings")
      .select(
        "id, shift_id, organization_id, office_location_id, professional_profile_id, status, agreed_hourly_rate_cents, agreed_starts_at, agreed_ends_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("conversations")
      .select("id, shift_id, booking_id, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("notifications")
      .select("id, user_id, type, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);
  const shifts = (shiftsResult.data ?? []) as ShiftRow[];
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const conversations = (conversationsResult.data ?? []) as ConversationRow[];
  const notifications = (notificationsResult.data ?? []) as NotificationRow[];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const professionalIds = Array.from(
    new Set(bookings.map((booking) => booking.professional_profile_id))
  );
  const lookupIds = collectLookupIds({ bookings, notifications, shifts });
  const [organizationsResult, locationsResult, rolesResult, professionalsResult, usersResult, messagesResult] =
    await Promise.all([
      lookupIds.organizationIds.length > 0
        ? supabase
            .from("organizations")
            .select("id, name")
            .in("id", lookupIds.organizationIds)
        : Promise.resolve({ data: [] }),
      lookupIds.locationIds.length > 0
        ? supabase
            .from("office_locations")
            .select("id, name, city, state")
            .in("id", lookupIds.locationIds)
        : Promise.resolve({ data: [] }),
      supabase.from("professional_roles").select("id, name"),
      professionalIds.length > 0
        ? supabase
            .from("professional_profiles")
            .select("id, user_id, professional_role_id")
            .in("id", professionalIds)
        : Promise.resolve({ data: [] }),
      lookupIds.userIds.length > 0
        ? supabase
            .from("user_profiles")
            .select("id, display_name, email")
            .in("id", lookupIds.userIds)
        : Promise.resolve({ data: [] }),
      conversationIds.length > 0
        ? supabase
            .from("messages")
            .select("id, conversation_id, sender_user_id, body, created_at")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] })
    ]);
  const professionals = (professionalsResult.data ?? []) as ProfessionalProfileRow[];
  const messages = (messagesResult.data ?? []) as MessageRow[];
  const messageSenderIds = messages.map((message) => message.sender_user_id);
  const professionalUserIds = professionals.map((professional) => professional.user_id);
  const missingUserIds = Array.from(
    new Set([...messageSenderIds, ...professionalUserIds].filter((id) => !lookupIds.userIds.includes(id)))
  );
  const missingUsersResult =
    missingUserIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id, display_name, email")
          .in("id", missingUserIds)
      : { data: [] };
  const users = [
    ...((usersResult.data ?? []) as UserProfileRow[]),
    ...((missingUsersResult.data ?? []) as UserProfileRow[])
  ];

  return {
    bookings,
    bookingsByShiftId: groupBookingsByShiftId(bookings),
    conversations,
    latestMessageByConversationId: latestMessagesByConversationId(messages),
    locationById: mapById((locationsResult.data ?? []) as LocationRow[]),
    metrics: {
      activeBookings: activeBookingsResult.count ?? 0,
      conversations: conversationsCountResult.count ?? 0,
      openShifts: openShiftsResult.count ?? 0,
      unreadNotifications: unreadNotificationsResult.count ?? 0
    },
    notifications,
    organizationById: mapById((organizationsResult.data ?? []) as OrganizationRow[]),
    professionalById: mapById(professionals),
    roleById: mapById((rolesResult.data ?? []) as ProfessionalRoleRow[]),
    shifts,
    userById: mapById(users)
  };
}

function ShiftCard({
  bookings,
  location,
  organization,
  role,
  shift
}: {
  bookings: BookingRow[];
  location?: LocationRow;
  organization?: OrganizationRow;
  role?: ProfessionalRoleRow;
  shift: ShiftRow;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{organization?.name ?? "Office"}</p>
          <p className="mt-1 text-sm font-semibold text-teal-700">
            {role?.name ?? "Professional role"}
          </p>
        </div>
        <Badge variant={shift.status === "open" ? "default" : "outline"}>
          {formatStatus(shift.status)}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <IconFact icon={<CalendarDays className="h-4 w-4" />} text={formatDate(shift.starts_at)} />
        <IconFact icon={<Clock className="h-4 w-4" />} text={formatTime(shift.starts_at, shift.ends_at)} />
        <IconFact icon={<MapPin className="h-4 w-4" />} text={formatLocation(location)} />
        <IconFact icon={<BriefcaseBusiness className="h-4 w-4" />} text={formatRate(shift.hourly_rate_cents)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{bookings.length} responses</Badge>
        <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
          <Link href={`/office/shifts/${shift.id}`}>Open detail</Link>
        </Button>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  location,
  organization,
  professional,
  roleById,
  userById
}: {
  booking: BookingRow;
  location?: LocationRow;
  organization?: OrganizationRow;
  professional?: ProfessionalProfileRow;
  roleById: Map<string, ProfessionalRoleRow>;
  userById: Map<string, UserProfileRow>;
}) {
  const user = professional ? userById.get(professional.user_id) : undefined;
  const role = professional ? roleById.get(professional.professional_role_id) : undefined;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <UserRound className="h-4 w-4 text-teal-700" />
            {user?.display_name ?? user?.email ?? "Professional"}
          </p>
          <p className="mt-1 text-sm font-semibold text-teal-700">
            {role?.name ?? "Professional role"}
          </p>
        </div>
        <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
          {formatStatus(booking.status)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {organization?.name ?? "Office"} at {formatLocation(location)}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600">
        <IconFact icon={<CalendarDays className="h-4 w-4" />} text={formatDate(booking.agreed_starts_at)} />
        <IconFact icon={<Clock className="h-4 w-4" />} text={formatTime(booking.agreed_starts_at, booking.agreed_ends_at)} />
      </div>
    </div>
  );
}

function ConversationCard({
  conversation,
  latestMessage,
  senderById
}: {
  conversation: ConversationRow;
  latestMessage?: MessageRow;
  senderById: Map<string, UserProfileRow>;
}) {
  const sender = latestMessage ? senderById.get(latestMessage.sender_user_id) : undefined;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-950">
            Conversation {conversation.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Updated {formatDateTime(conversation.updated_at)}
          </p>
        </div>
        <Badge variant="outline">{conversation.id.slice(0, 8)}</Badge>
      </div>
      {latestMessage ? (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-slate-950">
            {sender?.display_name ?? sender?.email ?? "Sender"}
          </p>
          <p className="mt-1 line-clamp-2 break-words leading-6 text-slate-600">
            {latestMessage.body}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No messages yet.
        </p>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  user
}: {
  notification: NotificationRow;
  user?: UserProfileRow;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{notification.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            To {user?.display_name ?? user?.email ?? "User"}
          </p>
        </div>
        <Badge variant={notification.read_at ? "outline" : "default"}>
          {notification.read_at ? "Read" : "Unread"}
        </Badge>
      </div>
      {notification.body ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{notification.body}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Mail className="h-4 w-4 text-teal-700" />
          {notification.type}
        </span>
        <span>{formatDateTime(notification.created_at)}</span>
      </div>
    </div>
  );
}

function Metric({
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
          <p className="text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">{text}</p>;
}

function IconFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 shrink-0 text-teal-700">{icon}</span>
      <span className="min-w-0 break-words">{text}</span>
    </p>
  );
}

function collectLookupIds({
  bookings,
  notifications,
  shifts
}: {
  bookings: BookingRow[];
  notifications: NotificationRow[];
  shifts: ShiftRow[];
}) {
  return {
    locationIds: Array.from(
      new Set([...shifts.map((shift) => shift.office_location_id), ...bookings.map((booking) => booking.office_location_id)])
    ),
    organizationIds: Array.from(
      new Set([...shifts.map((shift) => shift.organization_id), ...bookings.map((booking) => booking.organization_id)])
    ),
    userIds: Array.from(new Set(notifications.map((notification) => notification.user_id)))
  };
}

function groupBookingsByShiftId(bookings: BookingRow[]) {
  const bookingsByShiftId = new Map<string, BookingRow[]>();

  bookings.forEach((booking) => {
    if (!booking.shift_id) {
      return;
    }

    bookingsByShiftId.set(booking.shift_id, [
      ...(bookingsByShiftId.get(booking.shift_id) ?? []),
      booking
    ]);
  });

  return bookingsByShiftId;
}

function latestMessagesByConversationId(messages: MessageRow[]) {
  const latestByConversationId = new Map<string, MessageRow>();

  messages.forEach((message) => {
    if (!latestByConversationId.has(message.conversation_id)) {
      latestByConversationId.set(message.conversation_id, message);
    }
  });

  return latestByConversationId;
}

function mapById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

function formatLocation(location?: LocationRow) {
  if (!location) {
    return "Location not saved";
  }

  return [location.name, location.city, location.state].filter(Boolean).join(", ");
}

function formatRate(rateCents: number | null) {
  return rateCents ? `$${Math.round(rateCents / 100)}/hr` : "Rate TBD";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}
