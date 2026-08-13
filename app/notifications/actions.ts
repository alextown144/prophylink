"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  notificationOpenTargetSchema,
  notificationReadStateSchema
} from "@/lib/validation/account";

type NotificationTargetRow = {
  id: string;
  metadata: Json;
  type: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateNotificationReadState(formData: FormData) {
  const user = await requireUser();
  const parsed = notificationReadStateSchema.safeParse({
    action: formString(formData, "action"),
    notificationId: formString(formData, "notification_id")
  });

  if (!parsed.success) {
    redirect("/notifications?status=invalid");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/notifications?status=service_required");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({
      read_at: parsed.data.action === "read" ? new Date().toISOString() : null
    })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id);

  if (error) {
    redirect("/notifications?status=failed");
  }

  revalidatePath("/notifications");
  revalidatePath("/professional/dashboard");
  redirect(`/notifications?status=${parsed.data.action}`);
}

export async function openNotificationTarget(formData: FormData) {
  const user = await requireUser();
  const parsed = notificationOpenTargetSchema.safeParse({
    notificationId: formString(formData, "notification_id")
  });

  if (!parsed.success) {
    redirect("/notifications?status=invalid");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/notifications?status=service_required");
  }

  const admin = createSupabaseAdminClient();
  const { data: notificationData, error: readError } = await admin
    .from("notifications")
    .select("id, type, metadata")
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id)
    .maybeSingle();
  const notification = notificationData as NotificationTargetRow | null;

  if (readError || !notification) {
    redirect("/notifications?status=failed");
  }

  const { error: updateError } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notification.id)
    .eq("user_id", user.id);

  if (updateError) {
    redirect("/notifications?status=failed");
  }

  revalidatePath("/notifications");
  revalidatePath("/professional/dashboard");
  revalidatePath("/office/dashboard");
  redirect(getNotificationTargetHref(notification));
}

function getNotificationTargetHref(notification: NotificationTargetRow) {
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
    return shiftId ? `/professional/shifts/${shiftId}` : "/professional/shifts";
  }

  return "/notifications";
}

function getShiftIdFromMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const shiftId = metadata.shift_id;

  return typeof shiftId === "string" ? shiftId : null;
}

function getConversationIdFromMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const conversationId = metadata.conversation_id;

  return typeof conversationId === "string" ? conversationId : null;
}
