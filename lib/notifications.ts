import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

type OrganizationMemberRef = {
  user_id: string;
};

export type NotificationPayload = Omit<NotificationInsert, "user_id">;

export async function createNotificationForUser(
  admin: AdminClient,
  userId: string,
  payload: NotificationPayload
) {
  await admin.from("notifications").insert([{ ...payload, user_id: userId }] as never[]);
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

  await admin
    .from("notifications")
    .insert(userIds.map((userId) => ({ ...payload, user_id: userId })) as never[]);
}
