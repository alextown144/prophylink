import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl, sendEmail } from "@/lib/email";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type OrganizationMemberRef = {
  user_id: string;
};

type UserEmailRef = {
  email: string;
};

export type NotificationPayload = Omit<NotificationInsert, "user_id">;

export async function createNotificationForUser(
  admin: AdminClient,
  userId: string,
  payload: NotificationPayload
) {
  const { data } = await admin
    .from("notifications")
    .insert([{ ...payload, user_id: userId }] as never[])
    .select("id, user_id, type, title, body, metadata, created_at, read_at")
    .maybeSingle();

  if (data) {
    await sendNotificationEmail(admin, data as NotificationRow);
  }
}

export async function createNotificationsForOrganization(
  admin: AdminClient,
  organizationId: string,
  payload: NotificationPayload
) {
  const { data } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId);
  const userIds = Array.from(
    new Set(((data ?? []) as OrganizationMemberRef[]).map((member) => member.user_id))
  );

  if (userIds.length === 0) {
    return;
  }

  const { data: notifications } = await admin
    .from("notifications")
    .insert(userIds.map((userId) => ({ ...payload, user_id: userId })) as never[])
    .select("id, user_id, type, title, body, metadata, created_at, read_at");

  await Promise.all(
    ((notifications ?? []) as NotificationRow[]).map((notification) =>
      sendNotificationEmail(admin, notification)
    )
  );
}

const emailNotificationTypes = new Set([
  "credential_rejected",
  "credential_verified",
  "new_message",
  "shift_accepted",
  "shift_cancelled",
  "shift_completed",
  "shift_confirmed",
  "shift_declined",
  "shift_interest",
  "shift_selected"
]);

async function sendNotificationEmail(admin: AdminClient, notification: NotificationRow) {
  if (!emailNotificationTypes.has(notification.type)) {
    return;
  }

  const { data } = await admin
    .from("user_profiles")
    .select("email")
    .eq("id", notification.user_id)
    .maybeSingle();
  const user = data as UserEmailRef | null;

  if (!user?.email) {
    return;
  }

  const destination = notificationDestination(notification);
  const text = [
    notification.body ?? notification.title,
    "",
    `Open ProphyLink: ${destination}`,
    "",
    "You are receiving this because this event affects your ProphyLink beta account."
  ].join("\n");

  await sendEmail({
    idempotencyKey: `notification-${notification.id}`,
    subject: `ProphyLink: ${notification.title}`,
    text,
    to: user.email
  });
}

function notificationDestination(notification: NotificationRow) {
  const metadata =
    notification.metadata && typeof notification.metadata === "object" && !Array.isArray(notification.metadata)
      ? notification.metadata
      : {};
  const conversationId = typeof metadata.conversation_id === "string" ? metadata.conversation_id : null;

  if (conversationId) {
    return appUrl(`/messages/${conversationId}`);
  }

  if (notification.type === "credential_rejected" || notification.type === "credential_verified") {
    return appUrl("/professional/credentials");
  }

  if (
    notification.type === "shift_interest" ||
    notification.type === "shift_confirmed" ||
    notification.type === "shift_declined"
  ) {
    return appUrl("/office/dashboard");
  }

  if (
    notification.type === "shift_accepted" ||
    notification.type === "shift_selected" ||
    notification.type === "shift_cancelled" ||
    notification.type === "shift_completed"
  ) {
    return appUrl("/professional/shifts");
  }

  return appUrl("/notifications");
}
