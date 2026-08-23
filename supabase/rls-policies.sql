-- GT Adventures — Row Level Security policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every policy is dropped before it is created.

-- =====================================================================
-- Admin helper
-- SECURITY DEFINER so that reading profiles from inside a profiles policy
-- does not recurse back into that same policy.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- =====================================================================
-- profiles
-- A trekker may read and edit only their own row.
-- =====================================================================
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ( (select auth.uid()) = id );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- Undo the column-level grants from the first version of this file: PostgREST
-- upserts run as INSERT ... ON CONFLICT, which needs table-level privilege and
-- fails with "permission denied for table profiles" under column grants alone.
revoke insert (id, full_name, mobile_number) on public.profiles from authenticated;
revoke update (full_name, mobile_number) on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;

-- The policies above would otherwise let a trekker promote themselves by
-- writing role = 'admin'. A policy cannot compare the new value against the old
-- one, so a trigger pins the column instead: an end user's writes to `role` are
-- silently reverted, while admins and trusted server-side callers pass through.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No end-user JWT (SQL editor, service_role, signup trigger) => trusted
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'user';
  else
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- =====================================================================
-- saved_passengers
-- The trekker's private roster.
-- =====================================================================
alter table public.saved_passengers enable row level security;

drop policy if exists "Users manage their own saved passengers" on public.saved_passengers;
create policy "Users manage their own saved passengers"
  on public.saved_passengers for all
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- =====================================================================
-- bookings
-- A trekker sees and creates their own bookings, and may cancel one only
-- while it is still PENDING. Confirming a booking stays with the admin.
-- =====================================================================
alter table public.bookings enable row level security;

drop policy if exists "Users read their own bookings" on public.bookings;
create policy "Users read their own bookings"
  on public.bookings for select
  to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users create their own bookings" on public.bookings;
create policy "Users create their own bookings"
  on public.bookings for insert
  to authenticated
  with check ( (select auth.uid()) = user_id and booking_status = 'PENDING' );

drop policy if exists "Users cancel their own pending bookings" on public.bookings;
create policy "Users cancel their own pending bookings"
  on public.bookings for update
  to authenticated
  using ( (select auth.uid()) = user_id and booking_status = 'PENDING' )
  with check ( (select auth.uid()) = user_id and booking_status = 'CANCELLED' );

-- =====================================================================
-- passengers
-- Reachable only through a booking the trekker owns.
-- =====================================================================
alter table public.passengers enable row level security;

drop policy if exists "Users read passengers on their bookings" on public.passengers;
create policy "Users read passengers on their bookings"
  on public.passengers for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users add passengers to their bookings" on public.passengers;
create policy "Users add passengers to their bookings"
  on public.passengers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = (select auth.uid())
    )
  );

-- =====================================================================
-- treks
-- Public catalogue: anyone, signed in or not, may browse.
-- =====================================================================
alter table public.treks enable row level security;

drop policy if exists "Treks are publicly readable" on public.treks;
create policy "Treks are publicly readable"
  on public.treks for select
  to anon, authenticated
  using ( true );

-- =====================================================================
-- Admin access
-- Admins bypass the per-user rules on every table above.
-- =====================================================================
drop policy if exists "Admins have full access to profiles" on public.profiles;
create policy "Admins have full access to profiles"
  on public.profiles for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

drop policy if exists "Admins have full access to bookings" on public.bookings;
create policy "Admins have full access to bookings"
  on public.bookings for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

drop policy if exists "Admins have full access to passengers" on public.passengers;
create policy "Admins have full access to passengers"
  on public.passengers for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

drop policy if exists "Admins manage treks" on public.treks;
create policy "Admins manage treks"
  on public.treks for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );
