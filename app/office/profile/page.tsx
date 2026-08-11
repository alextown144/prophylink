import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  OfficeOnboardingForm,
  type OfficeOnboardingDefaults
} from "@/components/onboarding/office-onboarding-form";

type Organization = {
  id: string;
  name: string;
  primary_email: string | null;
  primary_phone: string | null;
  website: string | null;
};

type OrganizationMembership = {
  organization_id: string;
};

type Location = {
  name: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  software_used: string[];
};

export default async function OfficeProfilePage() {
  const user = await requireUser();
  const defaults = await getOfficeDefaults(user.id);

  return (
    <main className="container max-w-4xl py-10">
      <div className="mb-6">
        <Badge variant="secondary">Organization foundation</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Office profile
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          Practice and first-location details that future shift posting and
          professional search will use.
        </p>
      </div>
      <OfficeOnboardingForm defaults={defaults} />
    </main>
  );
}

async function getOfficeDefaults(userId: string): Promise<OfficeOnboardingDefaults> {
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  if (!organizationMembership?.organization_id) {
    return {};
  }

  const [organizationResult, locationResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, primary_email, primary_phone, website")
      .eq("id", organizationMembership.organization_id)
      .maybeSingle(),
    supabase
      .from("office_locations")
      .select(
        "name, address_line1, city, state, postal_code, phone, contact_name, contact_email, software_used"
      )
      .eq("organization_id", organizationMembership.organization_id)
      .limit(1)
      .maybeSingle()
  ]);
  const organization = organizationResult.data as Organization | null;
  const location = locationResult.data as Location | null;

  return {
    addressLine1: location?.address_line1,
    city: location?.city,
    contactEmail: location?.contact_email ?? organization?.primary_email,
    phone: location?.phone ?? organization?.primary_phone,
    postalCode: location?.postal_code,
    practiceName: location?.name ?? organization?.name,
    primaryContact: location?.contact_name,
    softwareUsed: location?.software_used?.join(", "),
    state: location?.state,
    website: organization?.website
  };
}
