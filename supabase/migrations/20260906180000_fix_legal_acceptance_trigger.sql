-- Fix legal acceptance tracking
-- Version 1.0
--
-- The legal acceptance must be recorded after the user's profile exists.
-- The previous trigger was attached to auth.users, while profiles.id is
-- referenced by legal_acceptances.profile_id.

-- Remove the previous trigger from auth.users
drop trigger if exists on_auth_user_legal_acceptance
on auth.users;

-- Remove the previous function
drop function if exists private.record_legal_acceptance();

-- Create the new function
create or replace function private.record_legal_acceptance_from_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_metadata jsonb;
begin
  select raw_user_meta_data
  into user_metadata
  from auth.users
  where id = new.id;

  if user_metadata ->> 'legal_terms_version' = '1.0'
     and user_metadata ->> 'legal_privacy_version' = '1.0'
  then
    insert into public.legal_acceptances (
      profile_id,
      terms_version,
      privacy_version,
      source
    )
    values (
      new.id,
      user_metadata ->> 'legal_terms_version',
      user_metadata ->> 'legal_privacy_version',
      'signup'
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

-- Record the legal acceptance once the profile has been created
drop trigger if exists on_profile_legal_acceptance
on public.profiles;

create trigger on_profile_legal_acceptance
after insert on public.profiles
for each row
execute function private.record_legal_acceptance_from_profile();