import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShiftPostingForm } from "@/components/office/shift-posting-form";
import { getShiftFormData } from "../data";

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
