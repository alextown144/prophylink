"use server";

import { revalidatePath } from "next/cache";
import { publicEnv } from "@/lib/config/env";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { hashInviteCode } from "@/lib/auth/invite";
import { signupSchema } from "@/lib/validation/account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  ok: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
};

export async function signUpWithAccount(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the account type, email, password, and invitation code."
    };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      message: "Supabase service role configuration is required for beta signup."
    };
  }

  const { accountKind, email, inviteCode, password } = parsed.data;
  const admin = createSupabaseAdminClient();
  let signupInvitationId: string | null = null;

  if (publicEnv.NEXT_PUBLIC_SIGNUP_MODE === "invite_only") {
    if (!inviteCode) {
      return { ok: false, message: "Invitation code is required for beta signup." };
    }

    const { data: invitation, error: inviteError } = await admin
      .from("signup_invitations")
      .select("id, email, account_kind, status, expires_at")
      .eq("token_hash", hashInviteCode(inviteCode))
      .maybeSingle();

    if (inviteError || !invitation) {
      return { ok: false, message: "Invitation code was not found." };
    }

    if (invitation.status !== "active") {
      return { ok: false, message: "Invitation code is no longer active." };
    }

    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return {
        ok: false,
        message: "Invitation code does not match this email address."
      };
    }

    if (invitation.account_kind !== accountKind) {
      return {
        ok: false,
        message: "Invitation code does not match this account type."
      };
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await admin
        .from("signup_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return { ok: false, message: "Invitation code has expired." };
    }

    signupInvitationId = invitation.id;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth/callback?next=/onboarding`,
      data: {
        account_kind: accountKind,
        signup_invitation_id: signupInvitationId
      }
    }
  });

  if (error || !data.user) {
    return {
      ok: false,
      message: error?.message ?? "Account could not be created."
    };
  }

  const userId = data.user.id;

  await admin.from("user_profiles").upsert({
    id: userId,
    signup_invitation_id: signupInvitationId,
    email
  });

  await admin.from("account_roles").upsert(
    {
      user_id: userId,
      kind: accountKind
    },
    { onConflict: "user_id,kind" }
  );

  if (data.session && signupInvitationId) {
    await admin
      .from("signup_invitations")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString()
      })
      .eq("id", signupInvitationId);
  }

  revalidatePath("/admin/users");

  if (!data.session) {
    return {
      ok: true,
      message:
        "Account created. Check your email to verify it. The confirmation link will bring you back to onboarding.",
      requiresEmailConfirmation: true
    };
  }

  return {
    ok: true,
    message: "Account created. Continue to onboarding."
  };
}

function getAppBaseUrl() {
  const configuredUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  if (configuredUrl !== "http://localhost:3000") {
    return configuredUrl;
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  return vercelUrl ? `https://${vercelUrl.replace(/\/$/, "")}` : configuredUrl;
}
