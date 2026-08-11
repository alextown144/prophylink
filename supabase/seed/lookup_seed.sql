insert into public.professional_roles (slug, name, enabled, sort_order) values
  ('dental_hygienist', 'Dental Hygienist', true, 10),
  ('dental_assistant', 'Dental Assistant', true, 20),
  ('expanded_function_dental_assistant', 'Expanded Function Dental Assistant', false, 30),
  ('sterilization_technician', 'Sterilization Technician', false, 40),
  ('front_office', 'Front Office', false, 50),
  ('treatment_coordinator', 'Treatment Coordinator', false, 60),
  ('office_manager', 'Office Manager', false, 70),
  ('dentist', 'Dentist', false, 80)
on conflict (slug) do update set
  name = excluded.name,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

insert into public.skills (slug, name, category, enabled) values
  ('local_anesthesia', 'Local Anesthesia', 'hygiene', true),
  ('nitrous_monitoring', 'Nitrous Monitoring', 'hygiene', true),
  ('periodontal_experience', 'Periodontal Experience', 'hygiene', true),
  ('pediatric_experience', 'Pediatric Experience', 'general', true),
  ('chairside_assisting', 'Chairside Assisting', 'assisting', true),
  ('impressions', 'Impressions', 'assisting', true),
  ('digital_scanning', 'Digital Scanning', 'assisting', true),
  ('sterilization', 'Sterilization', 'assisting', true),
  ('oral_surgery', 'Oral Surgery', 'assisting', true),
  ('orthodontics', 'Orthodontics', 'assisting', true),
  ('dentrix', 'Dentrix', 'software', true),
  ('eaglesoft', 'Eaglesoft', 'software', true),
  ('open_dental', 'Open Dental', 'software', true)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  enabled = excluded.enabled;

insert into public.credential_types (slug, name, requires_expiration) values
  ('professional_license', 'Professional License or Registration', true),
  ('cpr_bls', 'CPR/BLS', true),
  ('local_anesthesia_certification', 'Local Anesthesia Certification', true),
  ('expanded_function_credential', 'Expanded Function Credential', true),
  ('additional_certification', 'Additional Certification', true)
on conflict (slug) do update set
  name = excluded.name,
  requires_expiration = excluded.requires_expiration;

insert into public.subscription_plans (code, name, account_kind, stripe_price_env_key, entitlements, enabled) values
  (
    'professional_free',
    'Professional Free',
    'professional',
    null,
    '{"profile": true, "availability": true, "browse_shifts": true, "receive_invitations": true, "express_interest": true, "messaging": true}'::jsonb,
    true
  ),
  (
    'professional_plus',
    'Professional Plus',
    'professional',
    'STRIPE_PROFESSIONAL_PLUS_PRICE_ID',
    '{"coverage_exchange": true, "coverage_circle": true, "advanced_alerts": true}'::jsonb,
    true
  ),
  (
    'office_basic',
    'Office Basic',
    'office',
    'STRIPE_OFFICE_BASIC_PRICE_ID',
    '{"office_profile": true, "professional_search": true, "post_shifts": true, "request_professionals": true, "messaging": true, "favorites": true}'::jsonb,
    true
  ),
  (
    'office_pro',
    'Office Pro',
    'office',
    'STRIPE_OFFICE_PRO_PRICE_ID',
    '{"multiple_locations": true, "analytics": true, "preferred_roster": true}'::jsonb,
    true
  )
on conflict (code) do update set
  name = excluded.name,
  account_kind = excluded.account_kind,
  stripe_price_env_key = excluded.stripe_price_env_key,
  entitlements = excluded.entitlements,
  enabled = excluded.enabled;
