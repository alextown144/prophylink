import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SIGNUP_MODE: z.enum(["invite_only", "open"]).default("invite_only"),
  BETA_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true")
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SIGNUP_MODE: process.env.NEXT_PUBLIC_SIGNUP_MODE,
  BETA_MODE: process.env.BETA_MODE
});

export function isSupabaseConfigured() {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isInviteOnlySignup() {
  return publicEnv.NEXT_PUBLIC_SIGNUP_MODE === "invite_only";
}
