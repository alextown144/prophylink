"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";
import { uploadProfessionalCredential } from "@/app/professional/credentials/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CredentialTypeOption = {
  id: string;
  name: string;
  requires_expiration: boolean;
};

export function CredentialUploadForm({
  credentialTypes
}: {
  credentialTypes: CredentialTypeOption[];
}) {
  const [state, formAction] = useActionState(uploadProfessionalCredential, {
    ok: false,
    message: ""
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-teal-700" />
          Upload credential
        </CardTitle>
        <CardDescription>
          Upload license or certification documentation for admin review. Files stay private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="credential_type_id">Credential type</Label>
            <select
              className="focus-ring h-10 rounded-lg border bg-white px-3 text-sm"
              id="credential_type_id"
              name="credential_type_id"
              required
            >
              <option value="">Select a credential</option>
              {credentialTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="credential_number">Credential number optional</Label>
              <Input id="credential_number" name="credential_number" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issuing_state">Issuing state optional</Label>
              <Input id="issuing_state" name="issuing_state" placeholder="WA" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="issue_date">Issue date optional</Label>
              <Input id="issue_date" name="issue_date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiration_date">Expiration date optional</Label>
              <Input id="expiration_date" name="expiration_date" type="date" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="credential_file">File</Label>
            <Input
              accept="application/pdf,image/jpeg,image/png,image/webp"
              id="credential_file"
              name="credential_file"
              required
              type="file"
            />
            <p className="text-xs text-slate-500">PDF, JPG, PNG, or WebP. Max 10 MB.</p>
          </div>

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

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Uploading..." : "Upload for review"}
    </Button>
  );
}
