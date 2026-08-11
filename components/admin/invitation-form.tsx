"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSignupInvitation } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitationForm() {
  const [state, formAction] = useActionState(
    createSignupInvitation,
    { ok: false, message: "" }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create beta invitation</CardTitle>
        <CardDescription>
          Invitation codes are shown once and stored as hashes in the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-[1fr_12rem_12rem_auto]">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" placeholder="user@example.com" required type="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account_kind">Account type</Label>
            <select
              className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
              id="account_kind"
              name="account_kind"
            >
              <option value="professional">Professional</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expires_at">Expires</Label>
            <Input id="expires_at" name="expires_at" type="date" />
          </div>
          <div className="flex items-end">
            <SubmitButton />
          </div>
          {state.message ? (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700 md:col-span-4" role="status">
              {state.message}
              {state.inviteCode ? (
                <span className="mt-2 block rounded-md bg-white p-2 font-mono text-slate-950">
                  {state.inviteCode}
                </span>
              ) : null}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Creating..." : "Create invite"}
    </Button>
  );
}
