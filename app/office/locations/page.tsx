import { Building2, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Location = {
  id: string;
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

type OrganizationMembership = {
  organization_id: string;
};

export default async function OfficeLocationsPage() {
  const user = await requireUser();
  const locations = await getLocations(user.id);

  return (
    <main className="container py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary">Location model</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Office locations
          </h1>
          <p className="mt-2 leading-7 text-slate-600">
            Your first office location is live now. Multi-location management
            will expand from this model in a later milestone.
          </p>
        </div>
        <Button asChild>
          <Link href="/office/profile">
            <Pencil className="h-4 w-4" />
            Edit location foundation
          </Link>
        </Button>
      </div>
      <section className="grid gap-4">
        {locations.length > 0 ? (
          locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-700" />
                  {location.name ?? "Office location"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {location.address_line1}, {location.city}, {location.state}{" "}
                  {location.postal_code}
                </p>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>Contact: {location.contact_name || "Not saved"}</p>
                  <p>Email: {location.contact_email || "Not saved"}</p>
                  <p>Phone: {location.phone || "Not saved"}</p>
                  <p>
                    Software:{" "}
                    {location.software_used.length > 0
                      ? location.software_used.join(", ")
                      : "Not saved"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="font-semibold text-slate-950">No locations yet</p>
              <p className="mt-2 leading-7 text-slate-600">
                Complete the office profile to create your organization and first
                location.
              </p>
              <Button asChild className="mt-4">
                <Link href="/office/profile">Start office setup</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

async function getLocations(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const organizationMembership = membership as OrganizationMembership | null;

  if (!organizationMembership?.organization_id) {
    return [] as Location[];
  }

  const { data } = await supabase
    .from("office_locations")
    .select(
      "id, name, address_line1, city, state, postal_code, phone, contact_name, contact_email, software_used"
    )
    .eq("organization_id", organizationMembership.organization_id)
    .order("name", { ascending: true });

  return (data ?? []) as Location[];
}
