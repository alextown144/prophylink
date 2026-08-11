"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isSupabaseServiceRoleConfigured } from "@/lib/config/server-env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  dollarsToCents,
  officeOnboardingSchema,
  professionalOnboardingSchema,
  splitCsv
} from "@/lib/validation/account";

type ActionResult = {
  ok: boolean;
  message: string;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveProfessionalOnboarding(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = professionalOnboardingSchema.safeParse({
    firstName: formString(formData, "first_name"),
    lastName: formString(formData, "last_name"),
    professionalRole: formString(formData, "professional_role"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    postalCode: formString(formData, "postal_code"),
    hourlyRate: formString(formData, "hourly_rate").replace("$", ""),
    yearsExperience: formString(formData, "years_experience"),
    preferredRadius: formString(formData, "preferred_radius").replace(" miles", ""),
    shortBio: formString(formData, "short_bio")
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the required professional profile fields." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      message: "Supabase service role configuration is required to save onboarding."
    };
  }

  const admin = createSupabaseAdminClient();
  const profile = parsed.data;
  const { data: role, error: roleError } = await admin
    .from("professional_roles")
    .select("id")
    .eq("slug", profile.professionalRole)
    .eq("enabled", true)
    .maybeSingle();

  if (roleError || !role) {
    return { ok: false, message: "Selected professional role is not available." };
  }

  await admin.from("user_profiles").upsert({
    id: user.id,
    first_name: profile.firstName,
    last_name: profile.lastName,
    display_name: `${profile.firstName} ${profile.lastName}`,
    email: user.email ?? "",
    city: profile.city,
    state: profile.state,
    postal_code: profile.postalCode
  });

  await admin.from("account_roles").upsert(
    {
      user_id: user.id,
      kind: "professional",
      onboarding_completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,kind" }
  );

  const { error } = await admin.from("professional_profiles").upsert(
    {
      user_id: user.id,
      professional_role_id: role.id,
      short_bio: profile.shortBio,
      years_experience: profile.yearsExperience,
      hourly_rate_cents: dollarsToCents(profile.hourlyRate),
      preferred_radius_miles: profile.preferredRadius
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, message: "Professional profile could not be saved." };
  }

  revalidatePath("/professional/profile");
  revalidatePath("/professional/dashboard");

  redirect("/professional/dashboard");
}

export async function saveOfficeOnboarding(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = officeOnboardingSchema.safeParse({
    practiceName: formString(formData, "practice_name"),
    primaryContact: formString(formData, "primary_contact"),
    contactEmail: formString(formData, "contact_email"),
    addressLine1: formString(formData, "address_line1"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    postalCode: formString(formData, "postal_code"),
    phone: formString(formData, "phone"),
    website: formString(formData, "website"),
    softwareUsed: formString(formData, "software_used")
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the required office and location fields." };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      ok: false,
      message: "Supabase service role configuration is required to save onboarding."
    };
  }

  const admin = createSupabaseAdminClient();
  const office = parsed.data;

  await admin.from("user_profiles").upsert({
    id: user.id,
    display_name: office.primaryContact,
    email: user.email ?? office.contactEmail
  });

  await admin.from("account_roles").upsert(
    {
      user_id: user.id,
      kind: "office",
      onboarding_completed_at: new Date().toISOString()
    },
    { onConflict: "user_id,kind" }
  );

  const { data: existingMembership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let organizationId = existingMembership?.organization_id as string | undefined;

  if (organizationId) {
    await admin
      .from("organizations")
      .update({
        name: office.practiceName,
        primary_email: office.contactEmail,
        primary_phone: office.phone,
        website: office.website || null
      })
      .eq("id", organizationId);
  } else {
    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .insert({
        name: office.practiceName,
        primary_email: office.contactEmail,
        primary_phone: office.phone,
        website: office.website || null
      })
      .select("id")
      .single();

    if (organizationError || !organization) {
      return { ok: false, message: "Office organization could not be saved." };
    }

    organizationId = organization.id;

    await admin.from("organization_members").insert({
      organization_id: organizationId,
      user_id: user.id,
      role: "owner"
    });
  }

  if (!organizationId) {
    return { ok: false, message: "Office organization could not be resolved." };
  }

  const locationPayload = {
    organization_id: organizationId,
    name: office.practiceName,
    address_line1: office.addressLine1,
    city: office.city,
    state: office.state,
    postal_code: office.postalCode,
    phone: office.phone,
    contact_name: office.primaryContact,
    contact_email: office.contactEmail,
    software_used: splitCsv(office.softwareUsed)
  };

  const { data: existingLocation } = await admin
    .from("office_locations")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle();

  const { error } = existingLocation
    ? await admin
        .from("office_locations")
        .update(locationPayload)
        .eq("id", existingLocation.id)
    : await admin.from("office_locations").insert(locationPayload);

  if (error) {
    return { ok: false, message: "Office location could not be saved." };
  }

  revalidatePath("/office/profile");
  revalidatePath("/office/locations");
  revalidatePath("/office/dashboard");

  redirect("/office/dashboard");
}
