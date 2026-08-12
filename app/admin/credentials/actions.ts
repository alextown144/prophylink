"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createNotificationForUser } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { credentialReviewSchema } from "@/lib/validation/account";

type ProfessionalUserRef = {
  professional_profiles: {
    user_id: string;
  } | null;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewProfessionalCredential(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = credentialReviewSchema.safeParse({
    action: formString(formData, "action"),
    credentialId: formString(formData, "credential_id"),
    rejectionReason: formString(formData, "rejection_reason")
  });

  if (!parsed.success) {
    redirect("/admin/credentials?review=invalid");
  }

  const admin = createSupabaseAdminClient();
  const verifies = parsed.data.action === "verify";
  const now = new Date().toISOString();
  const { data: credentialData, error } = await admin
    .from("professional_credentials")
    .update({
      rejection_reason: verifies ? null : parsed.data.rejectionReason,
      status: verifies ? "verified" : "rejected",
      updated_at: now,
      verified_at: verifies ? now : null,
      verified_by: verifies ? adminUser.id : null
    } as never)
    .eq("id", parsed.data.credentialId)
    .select("professional_profiles(user_id)")
    .maybeSingle();

  if (error || !credentialData) {
    redirect("/admin/credentials?review=failed");
  }

  const credential = credentialData as ProfessionalUserRef;

  if (credential.professional_profiles?.user_id) {
    await createNotificationForUser(admin, credential.professional_profiles.user_id, {
      body: verifies
        ? "An admin verified one of your submitted credentials."
        : `An admin rejected one of your submitted credentials: ${parsed.data.rejectionReason}`,
      metadata: { credential_id: parsed.data.credentialId },
      title: verifies ? "Credential verified" : "Credential needs attention",
      type: verifies ? "credential_verified" : "credential_rejected"
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/credentials");
  revalidatePath("/notifications");
  revalidatePath("/professional/credentials");
  revalidatePath("/professional/dashboard");
  redirect(`/admin/credentials?review=${verifies ? "verified" : "rejected"}`);
}
