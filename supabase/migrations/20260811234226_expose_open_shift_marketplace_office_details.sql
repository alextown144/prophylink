create policy "Open shift organizations are readable to authenticated users"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1
      from public.shifts
      where shifts.organization_id = organizations.id
        and shifts.status = 'open'
    )
    or id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );

create policy "Open shift locations are readable to authenticated users"
  on public.office_locations for select
  to authenticated
  using (
    exists (
      select 1
      from public.shifts
      where shifts.office_location_id = office_locations.id
        and shifts.status = 'open'
    )
    or organization_id in (select public.current_user_organization_ids())
    or public.current_user_is_admin()
  );
