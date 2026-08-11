# Seed Strategy

The goal of seed data is to make the MVP demonstrable with a small but believable Tri-Cities marketplace.

## Lookup Data

Seed immediately:

- Signup invitations for beta professionals and offices
- Enabled roles: Dental Hygienist, Dental Assistant
- Disabled future roles: Dentist, Front Office, Treatment Coordinator, Office Manager
- Skills across hygiene, assisting, and software systems
- Credential types
- Subscription plan placeholders

## Demo Marketplace Data

After account/profile flows exist, seed:

- 6 hygienists
- 6 assistants
- 3 dental offices
- 1-2 locations per office as needed
- Availability across multiple upcoming dates
- Open shifts for both launch roles
- Credential records in pending, verified, rejected, and expired states
- Example bookings and coverage requests

## Auth Constraint

Supabase Auth users should be created through supported Supabase tooling or application flows. Avoid depending on direct manual inserts into `auth.users` for normal development setup.
