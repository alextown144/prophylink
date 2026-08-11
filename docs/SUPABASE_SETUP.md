# Supabase Setup

## Current State

The project includes:

- Supabase CLI dependency
- `supabase/config.toml`
- Initial migration: `supabase/migrations/20260811020729_initial_schema.sql`
- Lookup seed: `supabase/seed/lookup_seed.sql`
- First-admin bootstrap SQL: `supabase/admin/bootstrap_first_admin.sql`
- Typed Supabase clients with starter database types

Connected hosted project:

- Name: ProphyLink
- Project ref: `yqngavwlurezkdltawat`
- Region: `us-east-2`
- Postgres: `17.6`
- Applied migration: `20260811020729_initial_schema`
- Lookup seed applied: roles, skills, credential types, subscription plans
- RLS verified enabled on all public tables

## Hosted Project Setup

1. Create or select the Supabase project.
2. Copy the project values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Log in and link the CLI if using local CLI migration commands:

```bash
npm run supabase -- login
npm run supabase -- link --project-ref yqngavwlurezkdltawat
```

4. Apply migrations when they have not already been applied:

```bash
npm run db:push
```

5. Run `supabase/seed/lookup_seed.sql` in the Supabase SQL editor to load roles, skills, credential types, and subscription plans when they have not already been seeded.

6. Generate database types:

```bash
npm run types:supabase
```

7. Create the first admin Auth user, then run `supabase/admin/bootstrap_first_admin.sql` after replacing the placeholder email.

## Local Supabase Setup

Local Supabase requires Docker.

```bash
npm run supabase -- start
npm run db:lint
```

This workspace currently cannot run `db:lint` because no local Supabase database is listening on `127.0.0.1:54322`.
