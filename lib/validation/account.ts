import { z } from "zod";

export const accountKindSchema = z.enum(["professional", "office"]);

export const signupSchema = z.object({
  accountKind: accountKindSchema,
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().trim().optional()
});

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive().optional()
);

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional()
);

const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).optional()
);

export const professionalOnboardingSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  professionalRole: z.enum(["dental_hygienist", "dental_assistant"]),
  city: z.string().trim().min(1),
  state: z.string().trim().min(2).max(2),
  postalCode: z.string().trim().min(5),
  hourlyRate: optionalPositiveNumber,
  yearsExperience: optionalNonNegativeNumber,
  preferredRadius: optionalNonNegativeNumber,
  shortBio: z.string().trim().max(600).optional()
});

export const officeOnboardingSchema = z.object({
  practiceName: z.string().trim().min(1),
  primaryContact: z.string().trim().min(1),
  contactEmail: z.string().email(),
  addressLine1: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(2).max(2),
  postalCode: z.string().trim().min(5),
  phone: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal("")),
  softwareUsed: z.string().trim().optional()
});

const shiftPostingBaseSchema = z.object({
  officeLocationId: z.string().uuid(),
  professionalRoleId: z.string().uuid(),
  status: z.enum(["draft", "open"]).default("open"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  hourlyRate: optionalPositiveNumber,
  unpaidLunchMinutes: optionalNonNegativeInteger,
  description: z.string().trim().max(1000).optional(),
  requiredNotes: z.string().trim().max(1000).optional(),
  dressRequirements: z.string().trim().max(500).optional(),
  parkingInstructions: z.string().trim().max(500).optional(),
  arrivalInstructions: z.string().trim().max(500).optional()
});

export const shiftPostingSchema = withValidShiftTimeRange(shiftPostingBaseSchema);

export const shiftUpdateSchema = withValidShiftTimeRange(
  shiftPostingBaseSchema.extend({
    shiftId: z.string().uuid()
  })
);

function withValidShiftTimeRange<T extends z.AnyZodObject>(schema: T) {
  return schema.refine(
    (shift) => timeToMinutes(shift.endTime) > timeToMinutes(shift.startTime),
    {
      message: "End time must be after start time.",
      path: ["endTime"]
    }
  );
}

export const shiftInterestSchema = z.object({
  shiftId: z.string().uuid()
});

export const bookingSelectionSchema = z.object({
  bookingId: z.string().uuid(),
  shiftId: z.string().uuid()
});

export const availableProfessionalSelectionSchema = z.object({
  professionalProfileId: z.string().uuid(),
  shiftId: z.string().uuid()
});

export const bookingResponseSchema = z.object({
  action: z.enum(["confirm", "decline"]),
  bookingId: z.string().uuid(),
  shiftId: z.string().uuid()
});

export const officeBookingLifecycleSchema = z.object({
  action: z.enum(["complete", "cancel"]),
  bookingId: z.string().uuid(),
  shiftId: z.string().uuid()
});

export const createInvitationSchema = z.object({
  email: z.string().email(),
  accountKind: accountKindSchema,
  expiresAt: z.string().optional()
});

export function dollarsToCents(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 100);
}

export function splitCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
