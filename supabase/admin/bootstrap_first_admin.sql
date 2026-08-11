-- Bootstrap the first internal admin after creating a Supabase Auth user.
--
-- Usage:
-- 1. Create the first admin user through Supabase Auth or the app signup flow.
-- 2. Replace the email below.
-- 3. Run this SQL in the Supabase SQL editor or through a privileged database connection.

with target_user as (
  select id, email
  from auth.users
  where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
  limit 1
),
profile_upsert as (
  insert into public.user_profiles (id, email, display_name)
  select id, email, 'ProphyLink Admin'
  from target_user
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.user_profiles.display_name, excluded.display_name)
  returning id
)
insert into public.account_roles (user_id, kind, onboarding_completed_at)
select id, 'admin', now()
from profile_upsert
on conflict (user_id, kind) do update
  set onboarding_completed_at = coalesce(
    public.account_roles.onboarding_completed_at,
    excluded.onboarding_completed_at
  );
