# Decision Log

## 2026-08-10: Scope first run to Milestones 0-1

Decision: Build only planning and foundation in the first run.

Reason: The database and authorization shape will be expensive to change once profiles, availability, matching, bookings, and coverage exchange depend on it.

## 2026-08-10: Use flexible professional roles

Decision: Store roles in `professional_roles` and reference them from professional profiles and shifts.

Reason: Launch exposes hygienists and assistants, but ProphyLink should later support additional dental workforce roles without schema changes.

## 2026-08-10: Model office organizations and locations separately

Decision: Use `organizations` and `office_locations`.

Reason: Most beta customers may have one location, but multi-location practices should not require a redesign.

## 2026-08-10: Keep Coverage Exchange in the schema from the beginning

Decision: Include `coverage_requests`, `coverage_candidates`, and `professional_connections` in the initial schema proposal.

Reason: Coverage Exchange is a differentiating workflow and affects relationships among professionals, offices, and bookings.

## 2026-08-10: Do not implement payroll assumptions

Decision: Store shift parties and agreed rates, but do not model payroll, tax, benefits, or employment classification.

Reason: Classification and staffing regulations require legal review.

## 2026-08-10: Launch beta as invite-only without marketplace approval gates

Decision: Beta signup should be invite-only, but the product should support an easy later switch to open signup. Once invited users complete the required account setup, they should not need separate admin approval for marketplace access.

Reason: Invite-only controls early marketplace quality and pacing without creating operational friction for every professional and office after they join.

## 2026-08-10: Make subscription gates admin-configurable by plan

Decision: Subscription levels should control selectable capabilities through configurable entitlements. Admins should be able to change what each plan gates over time.

Reason: Pricing and packaging are not final, so search, shift posting, messaging, Coverage Exchange, advanced alerts, multiple locations, and similar capabilities should not be permanently tied to one hard-coded plan.

## 2026-08-10: Coverage Exchange MVP connects professionals, not offices

Decision: Coverage Exchange should support non-ProphyLink offices immediately, but the MVP should not automate office approval. The original professional who posts the coverage request is responsible for arranging permission and approval with their own office outside ProphyLink.

Reason: The early value is helping one hygienist or assistant find another qualified professional. Requiring the office to join or approve inside the product would add friction and delay the core professional-to-professional workflow.

## 2026-08-10: Store invite-only beta as first-class account state

Decision: Add `signup_invitations` with token hashes, status, account kind, expiration, inviter, and acceptance metadata.

Reason: Invite-only beta should be enforceable by backend logic while still allowing a clean switch to open signup later.

## 2026-08-10: Use server actions for account bootstrap

Decision: Validate signup invitations and persist profile, role, organization, and location foundation records through server actions using the Supabase service role.

Reason: Invite validation and account bootstrap cannot rely on browser-only checks, and onboarding should create consistent records even when email confirmation changes session behavior.
