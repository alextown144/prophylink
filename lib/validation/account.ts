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
