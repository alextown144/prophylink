import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShiftPostingForm } from "@/components/office/shift-posting-form";

type OrganizationMembership = {
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

export default async function NewOfficeShiftPage() {
  const user = await requireUser();
  const { locations, roles } = await getShiftFormData(user.id);

  return (
    <main className="container max-w-5xl py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/office/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Office dashboard
            </Link>
          </Button>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Post a shift</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Publish temporary coverage needs from your saved office location.
          </p>
        </div>
      </div>
      {locations.length > 0 ? (
        <ShiftPostingForm locations={locations} roles={roles} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold text-slate-950">Office setup needed</p>
            <p className="mt-2 leading-7 text-slate-600">
              Add your office profile and first location before posting shifts.
            </p>
            <Button asChild className="mt-4">
              <Link href="/office/profile">Finish office setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

async function getShiftFormData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  if (!organizationMembership?.organization_id) {
    return { locations: [], roles: [] };
  }

  const [locationsResult, rolesResult] = await Promise.all([
    supabase
      .from("office_locations")
      .select("id, name, city, state")
      .eq("organization_id", organizationMembership.organization_id)
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
