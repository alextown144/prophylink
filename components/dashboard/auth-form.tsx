"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signUpWithAccount } from "@/app/auth/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isInviteOnlySignup, isSupabaseConfigured } from "@/lib/config/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "signup";
};

type AccountRole = {
  kind: "professional" | "office" | "admin";
  onboarding_completed_at: string | null;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [accountKind, setAccountKind] = useState("professional");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";
  const inviteOnly = isSignup && isInviteOnlySignup();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage("Supabase environment values are required before authentication can run.");
      return;
    }

    setLoading(true);
    if (isSignup) {
      const result = await signUpWithAccount({
        accountKind,
        email,
        password,
        inviteCode: inviteOnly ? inviteCode : undefined
      });

      setMessage(result.message);
      setLoading(false);
      if (result.ok && !result.requiresEmailConfirmation) {
        router.refresh();
        router.push("/onboarding");
      }
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    setMessage("Signed in. Redirecting...");
    const nextPath = await getPostLoginPath(supabase);
    setLoading(false);
    router.refresh();
    router.push(nextPath);
  }

  return (
    <Card className="w-full max-w-md shadow-soft">
      <CardHeader>
        <CardTitle>{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup
            ? inviteOnly
              ? "Use your ProphyLink beta invitation to create an account."
              : "Start as a dental professional or dental office."
            : "Log in to continue to your ProphyLink workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <div className="grid gap-2">
              <Label htmlFor="account_kind">Account type</Label>
              <select
                className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
                id="account_kind"
                onChange={(event) => setAccountKind(event.target.value)}
                value={accountKind}
              >
                <option value="professional">Dental professional</option>
                <option value="office">Dental office</option>
              </select>
            </div>
          ) : null}
          {inviteOnly ? (
            <div className="grid gap-2">
              <Label htmlFor="invite_code">Invitation code</Label>
              <Input
                autoComplete="one-time-code"
                id="invite_code"
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="PROPHY-BETA-..."
                required
                value={inviteCode}
              />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete={isSignup ? "new-password" : "current-password"}
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {message ? (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700" role="status">
              {message}
            </p>
          ) : null}
          <Button disabled={loading} type="submit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSignup ? "Create account" : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

async function getPostLoginPath(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  const { data } = await supabase
    .from("account_roles")
    .select("kind, onboarding_completed_at");
  const roles = data as AccountRole[] | null;

  if (roles?.some((role) => role.kind === "admin")) {
    return "/admin";
  }

  const professionalRole = roles?.find((role) => role.kind === "professional");
  if (professionalRole) {
    return professionalRole.onboarding_completed_at
      ? "/professional/dashboard"
      : "/onboarding/professional";
  }

  const officeRole = roles?.find((role) => role.kind === "office");
  if (officeRole) {
    return officeRole.onboarding_completed_at ? "/office/dashboard" : "/onboarding/office";
  }

  return "/onboarding";
}
