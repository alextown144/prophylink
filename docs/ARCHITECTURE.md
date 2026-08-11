# Architecture

## Application

- Next.js App Router
- TypeScript strict mode
- React server components by default
- Client components only for interactive forms and widgets
- Tailwind CSS with shadcn/ui-style primitives
- Lucide icons

## Backend

- Supabase Auth for identity
- Supabase PostgreSQL for application data
- Supabase Storage for credential files and profile assets
- Supabase Row Level Security for authorization

## Deployment Target

- Vercel for application hosting
- Supabase managed project for database, auth, and storage
- Stripe for subscriptions in a later milestone
- Resend-compatible email abstraction in a later milestone

## Route Hierarchy

Public:

- `/`
- `/login`
- `/signup`
- `/onboarding`
- `/onboarding/professional`
- `/onboarding/office`

Future public routes:

- `/how-it-works`
- `/for-professionals`
- `/for-offices`
- `/pricing`

Professional app:

- `/professional/dashboard`
- `/professional/profile`
- future: `/professional/availability`, `/professional/shifts`, `/professional/coverage`, `/professional/messages`, `/professional/credentials`, `/professional/settings`

Office app:

- `/office/dashboard`
- `/office/profile`
- `/office/locations`
- future: `/office/search`, `/office/shifts`, `/office/roster`, `/office/messages`, `/office/billing`, `/office/settings`

Admin app:

- `/admin`
- `/admin/users`
- `/admin/subscriptions`
- future: `/admin/professionals`, `/admin/offices`, `/admin/credentials`, `/admin/shifts`, `/admin/coverage`, `/admin/bookings`

## Authorization Strategy

The application should use three authorization layers:

1. Supabase Auth session for identity.
2. Application membership records for account type and organization access.
3. PostgreSQL RLS policies for final data access enforcement.

Frontend route protection is only a user-experience layer. Data boundaries must be enforced by RLS.

Protected app routes use server-side helpers:

- `requireUser()` for professional, office, and general onboarding pages.
- `requireAdmin()` for admin pages.

These helpers redirect unauthenticated users to `/login` and redirect non-admin users away from admin pages. RLS remains the final enforcement boundary for data access.

## Configuration

Environment parsing lives in `lib/config/env.ts`. Beta behavior should stay centralized around `BETA_MODE`, not scattered throughout components.

Beta signup should be invite-only at launch, with a single centralized configuration path that can switch to open signup later. Marketplace access should not require separate admin approval after signup and onboarding. The app config uses `NEXT_PUBLIC_SIGNUP_MODE`, and the database includes `signup_invitations` so the final server-side signup flow can enforce invitation state.

Signup uses a server action so invite validation happens on the server before account bootstrap. Invitation codes are hashed with SHA-256 before storage.

Subscription gates should be configurable by plan and manageable by admins, rather than hard-coded to one fixed pricing model. Future admin tooling should allow capabilities such as search, shift posting, messaging, Coverage Exchange, advanced alerts, or multiple locations to be enabled per subscription level.

## Service Boundaries

Future milestones should keep these domains distinct:

- Identity and account setup
- Professional profiles and credentials
- Office organizations and locations
- Availability and scheduling
- Shifts and matching
- Bookings and workflow history
- Coverage Exchange
- Messaging and notifications
- Subscriptions and entitlements
- Admin operations

## Coverage Exchange MVP Boundary

Coverage Exchange should support shifts at non-ProphyLink offices immediately, because the original professional may work at an office that has not joined the platform. For MVP, the workflow connects the original professional with a replacement professional. The original professional is responsible for coordinating with their own office outside ProphyLink.

The app may collect lightweight office context such as office name, city, date, time, role, rate, and notes so replacement professionals understand the opportunity. It should not send office approval invitations, claim office approval, or require the office to have a ProphyLink account in the first Coverage Exchange workflow.

## Open Architecture Questions

- Whether Supabase Auth email confirmation should be required in beta.
