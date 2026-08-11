# ProphyLink Agent Guidance

## Product North Star

ProphyLink exists to make it dramatically easier for a dental office to fill a staffing gap and for a dental professional to find flexible work. If a feature does not directly help that goal, keep it out of the MVP unless it is foundational infrastructure.

## Current Milestone Boundary

Milestones 0-2 have foundation work in progress:

- Milestone 0: planning, architecture, schema proposal, route hierarchy, docs, implementation checklist.
- Milestone 1: Next.js foundation, TypeScript, Tailwind, shadcn-style UI, Supabase integration, environment validation, base layout, design system, authentication scaffolding.
- Milestone 2: invite-only beta account setup, professional profile foundation, office organization and location foundation, admin invite shell, subscription capability gate shell.

Do not proceed into credentials, availability, marketplace, booking, coverage exchange, messaging, billing, or full admin workflows until the milestone prompt explicitly asks for that work.

## Architecture Rules

- Use Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui patterns, Lucide icons.
- Use Supabase Auth, PostgreSQL, Storage, and Row Level Security.
- Use flexible `professional_roles` and `skills`; do not hard-code the schema around hygienists.
- Model organizations and locations separately from the start.
- Keep Coverage Exchange and professional-to-professional connections in the database design, even if workflows arrive later.
- Treat Coverage Exchange MVP as professional-to-professional matching. The original professional handles office permission outside ProphyLink; do not build mandatory in-app office approval for this workflow yet.
- Store historical booking values such as agreed rate and shift times on booking records.
- Do not implement payroll, tax, benefits, patient records, PHI workflows, or legal conclusions.
- Keep beta behavior behind centralized config such as `BETA_MODE` and `NEXT_PUBLIC_SIGNUP_MODE`.
- Launch beta as invite-only, but keep signup mode easy to switch to open signup later.
- Store invitation tokens as hashes and enforce invite validation on the server before launch.
- Do not require separate admin approval for marketplace access after invited users complete onboarding.
- Keep subscription gating data-driven and admin-changeable by plan.
- Record meaningful architectural decisions in `docs/DECISIONS.md`.

## Security and Privacy

- Never rely only on frontend checks for authorization.
- RLS must protect professional, office, conversation, booking, and admin data.
- Avoid collecting patient-identifying information.
- Do not expose personal phone/email publicly unless a workflow explicitly permits it.
- Use service-role keys only on trusted server code.

## Implementation Style

- Prefer small, understandable components and services.
- Avoid broad refactors unrelated to the current milestone.
- Use realistic fictional demo data.
- Run lint, typecheck, tests, audit, and build after implementation when the local runtime is available.
- Summaries must include decisions, changed files, checks, required env vars, external services, founder-input items, and the recommended next task.
