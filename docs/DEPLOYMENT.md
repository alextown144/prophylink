# Deployment

## Intended Services

- Vercel hosts the Next.js application.
- Supabase hosts Auth, PostgreSQL, Storage, and RLS policies.
- Stripe will support subscriptions in Milestone 8.
- Resend-compatible email support will be added behind an abstraction.

## Required Environment Variables

See `.env.example`.

Required for local app startup:

- `NEXT_PUBLIC_APP_URL`
- `BETA_MODE`

Required once Supabase is created:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is required for server actions that validate beta invitations and create account/profile foundation records. It must never be exposed to the browser.

## Local Runtime Note

This workspace has been verified with a portable Node.js runtime under `work/tools`. A normal developer setup can use system Node.js 24 LTS or compatible Node.js 20+.

Required once billing is implemented:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PROFESSIONAL_PLUS_PRICE_ID`
- `STRIPE_OFFICE_BASIC_PRICE_ID`
- `STRIPE_OFFICE_PRO_PRICE_ID`

Required for email handoff:

- `EMAIL_DELIVERY_MODE` (`off`, `log`, or `resend`)
- `RESEND_API_KEY`
- `EMAIL_FROM`

Use `EMAIL_DELIVERY_MODE=log` during setup to verify that app events reach the
email handoff path without sending real email. Use `EMAIL_DELIVERY_MODE=resend`
only after `RESEND_API_KEY` and a verified `EMAIL_FROM` sender are configured.

## Supabase Setup

See `docs/SUPABASE_SETUP.md`.

Summary:

1. Create a Supabase project.
2. Link the Supabase CLI.
3. Apply migrations from `supabase/migrations`.
4. Run lookup seed SQL.
5. Create Storage buckets for credential files and profile assets.
6. Configure Auth email templates and redirect URLs.
7. Add environment variables to local development and Vercel.

## Vercel Setup

1. Connect the repository to Vercel.
2. Set the environment variables for Preview and Production.
3. Deploy Preview.
4. Run smoke tests against login, signup, public landing page, and dashboard shells.

## Supabase Auth Redirects

In Supabase Dashboard > Authentication > URL Configuration:

- Set Site URL to the production app URL, for example `https://prophylink.vercel.app`.
- Add Redirect URLs:
  - `https://prophylink.vercel.app/**`
  - `http://localhost:3000/**` for local development only.

If Site URL is left as `http://localhost:3000`, signup confirmation emails can
send users to localhost on mobile devices and consume the one-time token.

## Legal and Compliance Gate

Before public launch, review `docs/LEGAL_REVIEW_NEEDED.md`.
