import { Building2, MapPin, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const locations = [
  {
    name: "Richland Family Dental",
    address: "123 Columbia Center Blvd",
    city: "Richland, WA 99352",
    software: "Dentrix"
  }
];

export default async function OfficeLocationsPage() {
  await requireUser();

  return (
    <main className="container py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary">Location model</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Office locations
          </h1>
          <p className="mt-2 leading-7 text-slate-600">
            Organizations can have one location now and many locations later.
          </p>
        </div>
        <Button type="button">
          <Plus className="h-4 w-4" />
          Add location
        </Button>
      </div>
      <section className="grid gap-4">
        {locations.map((location) => (
          <Card key={location.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-700" />
                {location.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4" />
                {location.address}, {location.city}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Practice software: {location.software}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
