# ProphyLink

**Connecting Dental Offices with Dental Professionals**

ProphyLink is a two-sided dental workforce marketplace for temporary staffing coverage. The MVP launches with Dental Hygienists and Dental Assistants while keeping the architecture flexible for additional dental roles, recruiting, continuing education, and professional-network features.

This repository currently contains the Milestone 0-1 foundation:

- Next.js App Router + TypeScript project scaffold
- Tailwind/shadcn-style design primitives
- Supabase client and environment validation scaffolding
- Public landing page
- Login/signup scaffolding
- Invite-only beta and onboarding scaffolding
- Professional, office, and admin account/profile shells
- Placeholder dashboard shells for professionals, offices, and admins
- Product, architecture, database, roadmap, deployment, and legal-review docs
- Initial Supabase schema proposal and seed strategy

## Local Setup

1. Install Node.js 20+ or use the portable runtime under `work/tools` if present.
2. Copy `.env.example` to `.env.local`.
3. Fill in Supabase public values when a Supabase project exists.
4. Install dependencies:

```bash
npm install
```

5. Run the development server:

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run check` runs lint, typecheck, tests, and build together.

## Supabase

See `docs/SUPABASE_SETUP.md` for hosted project setup, migrations, seed data, generated types, and first-admin bootstrap.

## Milestone Boundary

Do not build Milestones 2-10 until the database architecture and foundation are reviewed. See `docs/ROADMAP.md` and `docs/IMPLEMENTATION_CHECKLIST.md`.
