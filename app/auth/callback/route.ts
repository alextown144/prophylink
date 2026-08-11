import { NextRequest, NextResponse } from "next/server";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );

    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        await acceptSignupInvitationForUser(user.id);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_failed", requestUrl.origin)
  );
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/onboarding";
  }

  return value;
}

async function acceptSignupInvitationForUser(userId: string) {
  if (!isSupabaseServiceRoleConfigured()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("signup_invitation_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.signup_invitation_id) {
    return;
  }

  await admin
    .from("signup_invitations")
    .update({
      status: "accepted",
      accepted_by: userId,
      accepted_at: new Date().toISOString()
    })
    .eq("id", profile.signup_invitation_id)
    .eq("status", "active");
}
