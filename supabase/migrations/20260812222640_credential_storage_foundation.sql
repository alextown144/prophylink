insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'credentials',
  'credentials',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Professionals can manage own credentials" on public.professional_credentials;

create policy "Professionals can read own credentials"
  on public.professional_credentials for select
  to authenticated
  using (
    professional_profile_id = public.current_user_professional_profile_id()
    or public.current_user_is_admin()
  );

create policy "Professionals can insert own pending credentials"
  on public.professional_credentials for insert
  to authenticated
  with check (
    professional_profile_id = public.current_user_professional_profile_id()
    and status = 'pending'
    and verified_by is null
    and verified_at is null
  );

create policy "Admins can review credentials"
  on public.professional_credentials for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete credentials"
  on public.professional_credentials for delete
  to authenticated
  using (public.current_user_is_admin());

create policy "Professionals can read own credential files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'credentials'
    and (
      (storage.foldername(name))[1] = public.current_user_professional_profile_id()::text
      or public.current_user_is_admin()
    )
  );

create policy "Professionals can upload own credential files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'credentials'
    and (storage.foldername(name))[1] = public.current_user_professional_profile_id()::text
  );

create policy "Admins can manage credential files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'credentials' and public.current_user_is_admin())
  with check (bucket_id = 'credentials' and public.current_user_is_admin());
