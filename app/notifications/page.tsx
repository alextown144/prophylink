import { ArrowLeft, Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  openNotificationTarget,
  updateNotificationReadState
} from "@/app/notifications/actions";
import { requireUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{
  status?: string;
}>;

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  metadata: Json;
};

type AccountRole = {
  kind: "professional" | "office" | "admin";
};

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { status } = await searchParams;
  const { dashboardHref, notifications } = await getNotificationsPageData(user.id);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <main className="container py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Button asChild size="sm" variant="ghost">
            <Link href={dashboardHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-teal-700">
            Notification center
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Shift updates and alerts
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Review booking selections, shift responses, and account alerts as the
            marketplace workflow moves.
          </p>
        </div>
        <div className="flex h-14 min-w-36 items-center gap-3 rounded-lg border bg-white px-4">
          <Bell className="h-5 w-5 text-teal-700" />
          <div>
            <p className="text-2xl font-semibold text-slate-950">{unreadCount}</p>
            <p className="text-xs font-semibold text-slate-500">Unread</p>
          </div>
        </div>
      </div>

      <StatusMessage status={status} />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="rounded-lg bg-slate-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-slate-950">All clear</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                New shift selections and marketplace alerts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

async function getNotificationsPageData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [notificationsResult, rolesResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("account_roles").select("kind").eq("user_id", userId)
  ]);

  return {
    dashboardHref: getDashboardHref((rolesResult.data ?? []) as AccountRole[]),
    notifications: (notificationsResult.data ?? []) as Notification[]
  };
}

function NotificationRow({ notification }: { notification: Notification }) {
  const targetHref = getNotificationTargetHref(notification);
  const targetLabel = getNotificationTargetLabel(notification);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notification.read_at ? "outline" : "default"}>
              {notification.read_at ? "Read" : "New"}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {formatNotificationDate(notification.created_at)}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            {notification.title}
          </h2>
          {notification.body ? (
            <p className="mt-2 leading-7 text-slate-600">{notification.body}</p>
          ) : null}
        </div>
        <div className="grid shrink-0 gap-2 sm:flex sm:flex-wrap">
          {targetHref ? (
            <form action={openNotificationTarget} className="w-full sm:w-auto">
              <input name="notification_id" type="hidden" value={notification.id} />
              <Button className="w-full sm:w-auto" size="sm" type="submit">
                {targetLabel}
              </Button>
            </form>
          ) : null}
          <form action={updateNotificationReadState} className="w-full sm:w-auto">
            <input name="notification_id" type="hidden" value={notification.id} />
            <input
              name="action"
              type="hidden"
              value={notification.read_at ? "unread" : "read"}
            />
            <Button className="w-full sm:w-auto" size="sm" type="submit" variant="outline">
              {notification.read_at ? "Mark unread" : "Mark read"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status?: string }) {
  const message =
    {
      failed: "Notification could not be updated. Try again.",
      invalid: "That notification action was not valid.",
      read: "Notification marked read.",
      service_required: "Server configuration is required before updating notifications.",
      unread: "Notification marked unread."
    }[status ?? ""] ?? null;

  return message ? (
    <p className="mb-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold text-slate-700">
      {message}
    </p>
  ) : null;
}

function getNotificationTargetHref(notification: Notification) {
  const shiftId = getShiftIdFromMetadata(notification.metadata);
  const conversationId = getConversationIdFromMetadata(notification.metadata);

  if (notification.type === "new_message") {
    return conversationId ? `/messages/${conversationId}` : "/messages";
  }

  if (["shift_interest", "shift_confirmed", "shift_declined"].includes(notification.type)) {
    return shiftId ? `/office/shifts/${shiftId}` : "/office/dashboard";
  }

  if (
    [
      "shift_accepted",
      "shift_match",
      "shift_selected",
      "shift_cancelled",
      "shift_completed"
    ].includes(notification.type)
  ) {
    return "/professional/shifts";
  }

  return null;
}

function getShiftIdFromMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const shiftId = metadata.shift_id;

  return typeof shiftId === "string" ? shiftId : null;
}

function getNotificationTargetLabel(notification: Notification) {
  return notification.type === "new_message" ? "Open message" : "Review shift";
}

function getConversationIdFromMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const conversationId = metadata.conversation_id;

  return typeof conversationId === "string" ? conversationId : null;
}

function getDashboardHref(roles: AccountRole[]) {
  const roleKinds = new Set(roles.map((role) => role.kind));

  if (roleKinds.has("professional")) {
    return "/professional/dashboard";
  }

  if (roleKinds.has("office")) {
    return "/office/dashboard";
  }

  if (roleKinds.has("admin")) {
    return "/admin";
  }

  return "/onboarding";
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}
