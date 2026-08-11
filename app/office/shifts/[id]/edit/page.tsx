import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOfficeShift } from "@/app/office/shifts/actions";
import {
  getOfficeOrganizationId,
  getShiftFormData
} from "@/app/office/shifts/data";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  ShiftPostingForm,
  type ShiftPostingDefaults
} from "@/components/office/shift-posting-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EditableShift = {
  id: string;
  office_location_id: string;
  professional_role_id: string;
  status: "draft" | "open";
  starts_at: string;
  ends_at: string;
  hourly_rate_cents: number | null;
  unpaid_lunch_minutes: number | null;
  description: string | null;
  required_notes: string | null;
  dress_requirements: string | null;
  parking_instructions: string | null;
  arrival_instructions: string | null;
};

export default async function EditOfficeShiftPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [shift, formData] = await Promise.all([
    getEditableShift(user.id, id),
    getShiftFormData(user.id)
  ]);

  if (!shift) {
    notFound();
  }

  return (
    <main className="container max-w-5xl py-10">
      <div className="mb-6">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/office/shifts/${shift.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Shift details
          </Link>
        </Button>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Edit shift</h1>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Update the posted details professionals see on the shift marketplace.
        </p>
      </div>
      <ShiftPostingForm
        action={updateOfficeShift}
        defaults={toShiftPostingDefaults(shift)}
        locations={formData.locations}
        roles={formData.roles}
        submitLabel="Save shift changes"
        title="Edit shift"
      />
    </main>
  );
}

async function getEditableShift(userId: string, shiftId: string) {
  const organizationId = await getOfficeOrganizationId(userId);

  if (!organizationId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("shifts")
    .select(
      "id, office_location_id, professional_role_id, status, starts_at, ends_at, hourly_rate_cents, unpaid_lunch_minutes, description, required_notes, dress_requirements, parking_instructions, arrival_instructions"
    )
    .eq("id", shiftId)
    .eq("organization_id", organizationId)
    .in("status", ["draft", "open"])
    .maybeSingle();

  return data as EditableShift | null;
}

function toShiftPostingDefaults(shift: EditableShift): ShiftPostingDefaults {
  const start = formatPacificInputParts(shift.starts_at);
  const end = formatPacificInputParts(shift.ends_at);

  return {
    id: shift.id,
    officeLocationId: shift.office_location_id,
    professionalRoleId: shift.professional_role_id,
    status: shift.status,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    hourlyRate:
      typeof shift.hourly_rate_cents === "number"
        ? String(Math.round(shift.hourly_rate_cents / 100))
        : "",
    unpaidLunchMinutes:
      typeof shift.unpaid_lunch_minutes === "number"
        ? String(shift.unpaid_lunch_minutes)
        : "",
    description: shift.description,
    requiredNotes: shift.required_notes,
    dressRequirements: shift.dress_requirements,
    parkingInstructions: shift.parking_instructions,
    arrivalInstructions: shift.arrival_instructions
  };
}

function formatPacificInputParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "America/Los_Angeles",
    year: "numeric"
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
}
