create extension if not exists pgcrypto;

create type public.account_kind as enum ('professional', 'office', 'admin');
create type public.signup_invitation_status as enum ('active', 'accepted', 'revoked', 'expired');
create type public.credential_status as enum ('pending', 'verified', 'rejected', 'expired');
create type public.availability_kind as enum ('available', 'unavailable');
create type public.shift_status as enum ('draft', 'open', 'pending', 'filled', 'completed', 'cancelled');
create type public.booking_status as enum (
  'invited',
  'interested',
  'requested',
  'pending_office_approval',
  'accepted',
  'confirmed',
  'declined',
  'cancelled',
  'completed'
);
create type public.coverage_status as enum (
  'draft',
  'open',
  'candidate_selected',
  'pending_office_approval',
  'confirmed',
  'cancelled',
  'completed'
);
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'unpaid',
  'incomplete',
  'none'
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  signup_invitation_id uuid,
  first_name text,
  last_name text,
  display_name text,
  email text not null,
  phone text,
  avatar_url text,
  city text,
  state text,
  postal_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signup_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  account_kind public.account_kind not null,
  token_hash text not null unique,
  status public.signup_invitation_status not null default 'active',
  invited_by uuid references public.user_profiles(id),
  accepted_by uuid references public.user_profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add constraint user_profiles_signup_invitation_fk
  foreign key (signup_invitation_id) references public.signup_invitations(id);

create table public.account_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  kind public.account_kind not null,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table public.professional_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  enabled boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.user_profiles(id) on delete cascade,
  professional_role_id uuid not null references public.professional_roles(id),
  public_slug text unique,
  short_bio text,
  years_experience numeric(4, 1),
  employment_status text,
  hourly_rate_cents integer,
  minimum_hourly_rate_cents integer,
  preferred_radius_miles integer,
  preferred_cities text[] not null default '{}',
  willing_to_travel boolean not null default true,
  has_temp_experience boolean not null default false,
  is_student boolean not null default false,
  school_program text,
  expected_graduation_date date,
  is_new_graduate boolean not null default false,
  profile_visibility text not null default 'marketplace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.professional_skills (
  professional_profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (professional_profile_id, skill_id)
);

create table public.credential_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  requires_expiration boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  credential_type_id uuid not null references public.credential_types(id),
  credential_number text,
  issuing_state text,
  issue_date date,
  expiration_date date,
  file_path text,
  status public.credential_status not null default 'pending',
  rejection_reason text,
  verified_by uuid references public.user_profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  kind public.availability_kind not null default 'available',
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  recurrence_rule text,
  recurrence_starts_on date,
  recurrence_ends_on date,
  timezone text not null default 'America/Los_Angeles',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (starts_at is not null and ends_at is not null and ends_at > starts_at)
    or recurrence_rule is not null
  )
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  logo_url text,
  primary_phone text,
  primary_email text,
  website text,
  approved_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.office_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  timezone text not null default 'America/Los_Angeles',
  phone text,
  contact_name text,
  contact_email text,
  office_hours jsonb not null default '{}'::jsonb,
  software_used text[] not null default '{}',
  specialties text[] not null default '{}',
  operatories_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  office_location_id uuid not null references public.office_locations(id),
  professional_role_id uuid not null references public.professional_roles(id),
  created_by uuid references public.user_profiles(id),
  status public.shift_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/Los_Angeles',
  hourly_rate_cents integer,
  unpaid_lunch_minutes integer,
  description text,
  required_notes text,
  dress_requirements text,
  parking_instructions text,
  arrival_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.shift_required_skills (
  shift_id uuid not null references public.shifts(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (shift_id, skill_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  organization_id uuid not null references public.organizations(id),
  office_location_id uuid not null references public.office_locations(id),
  professional_profile_id uuid not null references public.professional_profiles(id),
  status public.booking_status not null default 'requested',
  agreed_hourly_rate_cents integer,
  agreed_starts_at timestamptz not null,
  agreed_ends_at timestamptz not null,
  cancelled_reason text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (agreed_ends_at > agreed_starts_at)
);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_user_id uuid references public.user_profiles(id),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.coverage_requests (
  id uuid primary key default gen_random_uuid(),
  original_professional_profile_id uuid not null references public.professional_profiles(id),
  organization_id uuid references public.organizations(id),
  office_location_id uuid references public.office_locations(id),
  external_office_name text,
  external_office_contact_email text,
  professional_role_id uuid not null references public.professional_roles(id),
  status public.coverage_status not null default 'draft',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/Los_Angeles',
  hourly_rate_cents integer,
  notes text,
  office_approval_required boolean not null default false,
  selected_candidate_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    organization_id is not null
    or external_office_name is not null
    or external_office_contact_email is not null
  )
);

create table public.coverage_candidates (
  id uuid primary key default gen_random_uuid(),
  coverage_request_id uuid not null references public.coverage_requests(id) on delete cascade,
  candidate_professional_profile_id uuid not null references public.professional_profiles(id),
  status text not null default 'interested',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coverage_request_id, candidate_professional_profile_id)
);

alter table public.coverage_requests
  add constraint coverage_requests_selected_candidate_fk
  foreign key (selected_candidate_id) references public.coverage_candidates(id);

create table public.professional_connections (
  id uuid primary key default gen_random_uuid(),
  owner_professional_profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  connected_professional_profile_id uuid not null references public.professional_profiles(id) on delete cascade,
  connection_type text not null default 'coverage_circle',
  created_at timestamptz not null default now(),
  unique (owner_professional_profile_id, connected_professional_profile_id, connection_type),
  check (owner_professional_profile_id <> connected_professional_profile_id)
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  professional_profile_id uuid references public.professional_profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (professional_profile_id is not null and organization_id is null)
    or (professional_profile_id is null and organization_id is not null)
  )
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  coverage_request_id uuid references public.coverage_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references public.user_profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  push_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_kind public.account_kind not null,
  stripe_price_env_key text,
  entitlements jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status public.subscription_status not null default 'none',
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (user_id is not null and organization_id is null)
    or (user_id is null and organization_id is not null)
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_user_id uuid not null references public.user_profiles(id),
  reviewee_user_id uuid references public.user_profiles(id),
  reviewee_organization_id uuid references public.organizations(id),
  ratings jsonb not null default '{}'::jsonb,
  comments text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  check (
    (reviewee_user_id is not null and reviewee_organization_id is null)
    or (reviewee_user_id is null and reviewee_organization_id is not null)
  )
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.user_profiles(id),
  entity_table text not null,
  entity_id uuid,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ce_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ce_courses (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.ce_providers(id),
  title text not null,
  credit_hours numeric(5, 2),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_roles
    where user_id = auth.uid()
      and kind = 'admin'
  );
$$;

create or replace function public.current_user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid();
$$;

create or replace function public.current_user_professional_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.professional_profiles
  where user_id = auth.uid();
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_profiles',
    'signup_invitations',
    'professional_profiles',
    'professional_credentials',
    'availability_rules',
    'organizations',
    'office_locations',
    'shifts',
    'bookings',
    'coverage_requests',
    'coverage_candidates',
    'conversations',
    'notification_preferences',
    'subscriptions'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.user_profiles enable row level security;
alter table public.signup_invitations enable row level security;
alter table public.account_roles enable row level security;
alter table public.professional_roles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.skills enable row level security;
alter table public.professional_skills enable row level security;
alter table public.credential_types enable row level security;
alter table public.professional_credentials enable row level security;
alter table public.availability_rules enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.office_locations enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_required_skills enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.coverage_requests enable row level security;
alter table public.coverage_candidates enable row level security;
alter table public.professional_connections enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_events enable row level security;
alter table public.ce_providers enable row level security;
alter table public.ce_courses enable row level security;

create policy "Users can read own profile"
  on public.user_profiles for select
  using (id = auth.uid() or public.current_user_is_admin());

create policy "Users can update own profile"
  on public.user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (id = auth.uid());

create policy "Admins can manage signup invitations"
  on public.signup_invitations for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Users can read own account roles"
  on public.account_roles for select
  using (user_id = auth.uid() or public.current_user_is_admin());

create policy "Public can read enabled professional roles"
  on public.professional_roles for select
  using (enabled = true or public.current_user_is_admin());

create policy "Public can read enabled skills"
  on public.skills for select
  using (enabled = true or public.current_user_is_admin());

create policy "Public can read credential types"
  on public.credential_types for select
  using (true);

create policy "Professionals can manage own profile"
  on public.professional_profiles for all
  using (user_id = auth.uid() or public.current_user_is_admin())
  with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "Professionals can manage own skills"
  on public.professional_skills for all
  using (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  )
  with check (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  );

create policy "Professionals can manage own credentials"
  on public.professional_credentials for all
  using (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  )
  with check (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  );

create policy "Professionals can manage own availability"
  on public.availability_rules for all
  using (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  )
  with check (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  );

create policy "Organization members can read organizations"
  on public.organizations for select
  using (
    id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Organization members can update organizations"
  on public.organizations for update
  using (
    id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  )
  with check (
    id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Organization members can read memberships"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Organization members can manage locations"
  on public.office_locations for all
  using (
    organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  )
  with check (
    organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Open shifts are readable to authenticated users"
  on public.shifts for select
  using (status = 'open' or organization_id in (select public.current_user_organization_ids()) or public.current_user_is_admin());

create policy "Offices can manage own shifts"
  on public.shifts for all
  using (
    organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  )
  with check (
    organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Shift skills follow shift visibility"
  on public.shift_required_skills for select
  using (
    exists (
      select 1 from public.shifts
      where shifts.id = shift_required_skills.shift_id
        and (shifts.status = 'open' or shifts.organization_id in (select public.current_user_organization_ids()) or public.current_user_is_admin())
    )
  );

create policy "Booking participants can read bookings"
  on public.bookings for select
  using (
    professional_profile_id = public.current_user_professional_profile_id()
    or organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Coverage participants can read coverage"
  on public.coverage_requests for select
  using (
    status = 'open'
    or original_professional_profile_id = public.current_user_professional_profile_id()
    or organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Professionals can manage own coverage requests"
  on public.coverage_requests for all
  using (
    original_professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  )
  with check (
    original_professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  );

create policy "Conversation members can read conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = conversations.id
        and conversation_members.user_id = auth.uid()
    )
    or public.current_user_is_admin()
  );

create policy "Conversation members can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.user_id = auth.uid()
    )
    or public.current_user_is_admin()
  );

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid() or public.current_user_is_admin());

create policy "Users can manage own notification preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid() or public.current_user_is_admin())
  with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "Plan catalog is readable"
  on public.subscription_plans for select
  using (enabled = true or public.current_user_is_admin());

create policy "Subscription owners can read subscriptions"
  on public.subscriptions for select
  using (
    user_id = auth.uid()
    or organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Users can manage own favorites"
  on public.favorites for all
  using (user_id = auth.uid() or public.current_user_is_admin())
  with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "Admins can read audit events"
  on public.audit_events for select
  using (public.current_user_is_admin());
