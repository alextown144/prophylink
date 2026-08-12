"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notificationReadStateSchema } from "@/lib/validation/account";

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
