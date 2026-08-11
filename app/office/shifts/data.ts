import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ShiftLocationOption = {
  id: string;
  label: string;
};

export type ShiftRoleOption = {
  id: string;
  label: string;
};

export type OrganizationMembership = {
  organization_id: string;
};

type LocationRecord = {
  id: string;
  name: string | null;
  city: string;
  state: string;
};

type ProfessionalRoleRecord = {
  id: string;
  name: string;
};

export async function getOfficeOrganizationId(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  return organizationMembership?.organization_id ?? null;
}

export async function getShiftFormData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getOfficeOrganizationId(userId);

  if (!organizationId) {
    return { locations: [], roles: [] };
  }

  const [locationsResult, rolesResult] = await Promise.all([
    supabase
      .from("office_locations")
      .select("id, name, city, state")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("professional_roles")
      .select("id, name")
      .eq("enabled", true)
      .order("name", { ascending: true })
  ]);

  const locationRecords = (locationsResult.data ?? []) as LocationRecord[];
  const roleRecords = (rolesResult.data ?? []) as ProfessionalRoleRecord[];

  return {
    locations: locationRecords.map((location) => ({
      id: location.id,
      label: `${location.name ?? "Office location"} - ${location.city}, ${location.state}`
    })),
    roles: roleRecords.map((role) => ({
      id: role.id,
      label: role.name
    }))
  };
}
