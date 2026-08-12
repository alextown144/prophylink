"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { credentialUploadSchema } from "@/lib/validation/account";

type ActionResult = {
  ok: boolean;
  message: string;
};

type ProfessionalProfileRef = {
  id: string;
};

type CredentialTypeRef = {
  id: string;
};

type CredentialInsert = Database["public"]["Tables"]["professional_credentials"]["Insert"];

const credentialBucket = "credentials";
const maxCredentialFileBytes = 10 * 1024 * 1024;
const allowedCredentialMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function uploadProfessionalCredential(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = credentialUploadSchema.safeParse({
    credentialNumber: formString(formData, "credential_number"),
    credentialTypeId: formString(formData, "credential_type_id"),
    expirationDate: formString(formData, "expiration_date"),
    issueDate: formString(formData, "issue_date"),
    issuingState: formString(formData, "issuing_state")
  });
  const file = formData.get("credential_file");

  if (!parsed.success) {
    return { ok: false, message: "Check the credential details." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, message: "Server storage configuration is required before uploading credentials." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a credential file to upload." };
  }

  if (file.size > maxCredentialFileBytes) {
    return { ok: false, message: "Credential files must be 10 MB or smaller." };
  }

  if (!allowedCredentialMimeTypes.has(file.type)) {
    return { ok: false, message: "Upload a PDF, JPG, PNG, or WebP file." };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: professionalProfileData }, { data: credentialTypeData }] =
    await Promise.all([
      supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("credential_types")
        .select("id")
        .eq("id", parsed.data.credentialTypeId)
        .maybeSingle()
    ]);
  const professionalProfile = professionalProfileData as ProfessionalProfileRef | null;
  const credentialType = credentialTypeData as CredentialTypeRef | null;

  if (!professionalProfile) {
    return { ok: false, message: "Complete your professional profile before uploading credentials." };
  }

  if (!credentialType) {
    return { ok: false, message: "Choose a valid credential type." };
  }

  const admin = createSupabaseAdminClient();
  const filePath = `${professionalProfile.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await admin.storage
    .from(credentialBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return { ok: false, message: "Credential file could not be uploaded." };
  }

  const credential = parsed.data;
  const payload: CredentialInsert = {
    credential_number: credential.credentialNumber || null,
    credential_type_id: credential.credentialTypeId,
    expiration_date: credential.expirationDate || null,
    file_path: filePath,
    issue_date: credential.issueDate || null,
    issuing_state: credential.issuingState || null,
    professional_profile_id: professionalProfile.id,
    status: "pending"
  };
  const { error } = await admin.from("professional_credentials").insert([payload] as never[]);

  if (error) {
    await admin.storage.from(credentialBucket).remove([filePath]);
    return { ok: false, message: "Credential could not be saved." };
  }

  revalidatePath("/professional/credentials");
  revalidatePath("/professional/dashboard");
  revalidatePath("/admin/credentials");
  revalidatePath("/admin");

  return { ok: true, message: "Credential uploaded for admin review." };
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "credential";
}
