"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createInviteCode, hashInviteCode } from "@/lib/auth/invite";
import { normalizeEmailSender, sendEmail } from "@/lib/email";
import { serverEnv } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInvitationSchema } from "@/lib/validation/account";

type ActionResult = {
  ok: boolean;
  message: string;
  inviteCode?: string;
};

type EmailTestActionResult = {
  ok: boolean;
  message: string;
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

export async function sendAdminTestEmail(
  previousState: EmailTestActionResult
): Promise<EmailTestActionResult> {
  void previousState;

  const adminUser = await requireAdmin();
  const to = adminUser.email;

  if (!to) {
    return { ok: false, message: "Your admin account does not have an email address." };
  }

  if (serverEnv.EMAIL_DELIVERY_MODE !== "resend") {
    return {
      ok: false,
      message: `Email delivery mode is ${serverEnv.EMAIL_DELIVERY_MODE}. Set EMAIL_DELIVERY_MODE=resend in Vercel.`
    };
  }

  if (!serverEnv.RESEND_API_KEY || !normalizeEmailSender(serverEnv.EMAIL_FROM)) {
    return {
      ok: false,
      message: "Resend API key or sender address is missing in the running environment."
    };
  }

  const result = await sendEmail({
    idempotencyKey: `admin-test-${adminUser.id}-${Date.now()}`,
    subject: "ProphyLink email test",
    text: "This is a ProphyLink transactional email test from the admin dashboard.",
    to
  });

  return result.delivered
    ? { ok: true, message: `Test email sent to ${to}.` }
    : {
        ok: false,
        message: "Resend did not accept the test email. Check Vercel runtime logs for the Resend error."
      };
}
