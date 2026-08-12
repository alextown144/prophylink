import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  EMAIL_DELIVERY_MODE: z.enum(["off", "log", "resend"]).default("off"),
  EMAIL_FROM: z.string().optional().or(z.literal("")),
  RESEND_API_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal(""))
});

export const serverEnv = serverEnvSchema.parse({
  EMAIL_DELIVERY_MODE: process.env.EMAIL_DELIVERY_MODE,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

export function isSupabaseServiceRoleConfigured() {
  return Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

export function isEmailDeliveryConfigured() {
  return (
    serverEnv.EMAIL_DELIVERY_MODE === "log" ||
    Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM)
  );
}
