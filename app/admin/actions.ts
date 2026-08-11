"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createInviteCode, hashInviteCode } from "@/lib/auth/invite";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInvitationSchema } from "@/lib/validation/account";

type ActionResult = {
  ok: boolean;
  message: string;
  inviteCode?: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createSignupInvitation(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const adminUser = await requireAdmin();
  const parsed = createInvitationSchema.safeParse({
    email: formString(formData, "email"),
    accountKind: formString(formData, "account_kind"),
    expiresAt: formString(formData, "expires_at")
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the invitation email and account type." };
  }

  const inviteCode = createInviteCode();
  const admin = createSupabaseAdminClient();
  const { email, accountKind, expiresAt } = parsed.data;
  const expiresAtTimestamp = expiresAt
    ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
    : null;
  const { error } = await admin.from("signup_invitations").insert({
    email,
    account_kind: accountKind,
    token_hash: hashInviteCode(inviteCode),
    invited_by: adminUser.id,
    expires_at: expiresAtTimestamp
  });

  if (error) {
    return { ok: false, message: "Invitation could not be created." };
  }

  revalidatePath("/admin/users");

  return {
    ok: true,
    message: "Invitation created. Show the code once to the invited user.",
    inviteCode
  };
}
