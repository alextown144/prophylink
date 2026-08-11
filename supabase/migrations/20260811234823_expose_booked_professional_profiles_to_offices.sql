create policy "Booked professional profiles are readable to offices"
  on public.professional_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings
      where bookings.professional_profile_id = professional_profiles.id
        and bookings.organization_id in (select public.current_user_organization_ids())
    )
    or user_id = auth.uid()
    or public.current_user_is_admin()
  );

create policy "Booked professional user profiles are readable to offices"
  on public.user_profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles
      join public.bookings
        on bookings.professional_profile_id = professional_profiles.id
      where professional_profiles.user_id = user_profiles.id
        and bookings.organization_id in (select public.current_user_organization_ids())
    )
    or id = auth.uid()
    or public.current_user_is_admin()
  );
