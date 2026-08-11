# Implementation Checklist

## Milestone 0

- [x] Inspect repository
- [x] Create `AGENTS.md`
- [x] Create product and architecture documentation
- [x] Propose PostgreSQL/Supabase schema
- [x] Document authentication, authorization, and RLS strategy
- [x] Define route hierarchy
- [x] Document assumptions and decisions

## Milestone 1

- [x] Create Next.js App Router scaffold
- [x] Add TypeScript strict configuration
- [x] Add Tailwind configuration and global styles
- [x] Add shadcn-style UI primitives
- [x] Add Supabase browser client scaffolding
- [x] Add environment validation
- [x] Add public layout and landing page
- [x] Add login and signup scaffolding
- [x] Add professional dashboard shell
- [x] Add office dashboard shell
- [x] Add admin dashboard shell
- [x] Add development seed strategy
- [x] Add lint, typecheck, test, and build commands
- [x] Run checks after Node/npm are available

## Founder Review Before Milestone 2

- [x] Confirm whether beta signup is invite-only.
- [ ] Confirm whether email verification is required during beta.
- [x] Confirm admin approval rules for professionals and offices.
- [x] Confirm office subscription gating behavior.
- [x] Confirm Coverage Exchange MVP path for non-ProphyLink offices.
- [ ] Confirm credential file retention and privacy expectations.

## Milestone 2

- [x] Add invite-only beta database model.
- [x] Keep signup mode configurable for later open signup.
- [x] Expose launch roles: Dental Hygienist and Dental Assistant.
- [x] Add professional onboarding shell.
- [x] Add office organization onboarding shell.
- [x] Add office location shell.
- [x] Add admin invitation-management shell.
- [x] Add admin subscription capability-gating shell.
- [x] Persist onboarding form submissions to Supabase through server actions.
- [x] Add server-side invite validation and account creation.
- [x] Add authenticated route guards.
- [x] Run checks after Node/npm are available.
- [ ] Add generated Supabase database types after the project exists.
- [ ] Runtime-test signup and onboarding against a real Supabase project.

## Local Verification

- [x] Provision portable Node/npm runtime under `work/tools`.
- [x] Install dependencies and create `package-lock.json`.
- [x] Run lint.
- [x] Run typecheck.
- [x] Run unit tests.
- [x] Run production build.
- [x] Run npm audit with zero reported vulnerabilities.
- [x] Add project-level Supabase CLI.
- [x] Add Supabase setup config and commands.
- [x] Add first-admin bootstrap SQL.
- [ ] Run Supabase DB lint after Docker/local Supabase is available.
- [x] Apply migrations to hosted Supabase project.
- [x] Apply lookup seed to hosted Supabase project.
- [x] Verify RLS enabled on hosted public tables.
