"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendAdminTestEmail } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function EmailTestForm() {
  const [state, formAction] = useActionState(sendAdminTestEmail, {
    ok: false,
    message: ""
  });

  return (
    <form action={formAction} className="grid gap-3">
      <SubmitButton />
      {state.message ? (
        <p
          className={`rounded-lg p-3 text-sm ${
            state.ok ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full sm:w-auto" disabled={pending} type="submit" variant="outline">
      {pending ? "Sending..." : "Send test email"}
    </Button>
  );
}
