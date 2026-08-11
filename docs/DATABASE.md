# Database Design

## Principles

- Keep identity separate from profiles.
- Support multiple account types per auth user where practical.
- Do not hard-code dental hygienists into the schema.
- Use normalized lookup tables for professional roles, skills, credential types, and subscription plans.
- Model organizations and locations separately.
- Store historical values on bookings.
- Use RLS for every user-facing table.
- Avoid storing patient information.

## Core Entity Groups

### Identity

- `user_profiles`: one row per Supabase auth user.
- `account_roles`: user role assignments such as professional, office member, and admin.
- `signup_invitations`: invite-only beta access records with status, account type, token hash, inviter, acceptance, and expiration fields.

### Professional

- `professional_roles`: enabled and disabled role catalog.
- `professional_profiles`: public-safe professional profile data.
- `skills`: administrator-manageable skill catalog.
- `professional_skills`: many-to-many skills.
- `credential_types`: license and certification catalog.
- `professional_credentials`: uploaded credential metadata and verification status.

### Availability

- `availability_rules`: recurring or one-time availability and unavailable overrides.
- Future booking conflict prevention should add exclusion constraints for confirmed booking time ranges.

### Office

- `organizations`: practice-level entity.
- `organization_members`: users connected to organizations.
- `office_locations`: physical locations.

### Marketplace

- `shifts`: office-created open shifts.
- `shift_required_skills`: required and preferred skills.
- `bookings`: workflow connection among office, shift, professional, and agreed historical values.
- `booking_events`: auditable workflow events.

### Coverage Exchange

- `coverage_requests`: professional-created coverage needs.
- `coverage_candidates`: replacement professional responses.
- `professional_connections`: future Coverage Circle and trusted professional network.

For MVP, coverage requests may reference an existing ProphyLink office or store lightweight external office context. Office approval is not automated in the app; the posting professional is responsible for arranging approval with their office.

### Communication

- `conversations`: associated with shift, booking, or coverage request.
- `conversation_members`: participants.
- `messages`: conversation messages.
- `notifications`: in-app notification rows.
- `notification_preferences`: email, SMS, and future push preferences.

### Billing

- `subscription_plans`: configurable entitlement plan catalog.
- `subscriptions`: Stripe customer and subscription references.

Subscription plan entitlements should remain data-driven so admins can adjust gated capabilities by subscription level without code changes for every pricing experiment.

## Invitation Model

Invite-only beta should be enforced through server-side signup logic before public launch. The schema stores invitation tokens as hashes, not plaintext invite codes. Admins create, revoke, and monitor invitations. Accepted invitations can create the matching `user_profiles` and `account_roles` records.

Open signup should be a configuration change, not a schema change.

Admin-created invitations currently support professional and office accounts. Admin user bootstrap should be handled manually through Supabase/admin SQL for the first internal account, then through admin tooling afterward.

### Reviews and Admin

- `reviews`: post-shift review records.
- `audit_events`: admin and marketplace audit trail.

## RLS Strategy

RLS policies should be designed around these rules:

- Users can read and update their own `user_profiles`.
- Professionals can manage their own professional profile, skills, credentials, and availability.
- Offices can manage organizations and locations through `organization_members`.
- Offices can manage shifts owned by their organizations.
- Professionals can see open shifts and coverage requests only when the product rules allow it.
- Booking participants can see their own bookings.
- Conversation members can see and write messages in conversations they belong to.
- Admin users can read and moderate marketplace records through explicit `admin` account roles.

## Double Booking

Milestone 5 should enforce overlap prevention at the database level. Recommended approach:

- Store confirmed booking start and end as `timestamptz`.
- Add a GiST exclusion constraint over professional ID and time range for active confirmed bookings.
- Keep cancelled and declined bookings outside the constraint.

## Migration

The initial proposal lives in:

- `supabase/migrations/20260811020729_initial_schema.sql`

It includes lookup tables, core marketplace tables, RLS enablement, helper functions, and starter policies. It is intentionally broad enough to review architecture, but later milestones should refine policies as workflows are implemented.
