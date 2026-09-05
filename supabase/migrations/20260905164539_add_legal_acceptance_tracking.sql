-- Legal acceptance tracking
-- Version 1.0

create table if not exists public.legal_acceptances (
  profile_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  terms_version text not null,
  privacy_version text not null,

  accepted_at timestamptz not null default now(),

  source text not null default 'signup'
);

alter table public.legal_acceptances enable row level security;

drop policy if exists "Users can view their own legal acceptance"
on public.legal_acceptances;

create policy "Users can view their own legal acceptance"
on public.legal_acceptances
for select
to authenticated
using (
  profile_id = auth.uid()
);

revoke insert, update, delete
on public.legal_acceptances
from anon, authenticated;

grant select
on public.legal_acceptances
to authenticated;

create or replace function private.record_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  if new.raw_user_meta_data ->> 'legal_terms_version' = '1.0'
     and new.raw_user_meta_data ->> 'legal_privacy_version' = '1.0'
  then

    insert into public.legal_acceptances (
      profile_id,
      terms_version,
      privacy_version,
      source
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'legal_terms_version',
      new.raw_user_meta_data ->> 'legal_privacy_version',
      'signup'
    )
    on conflict (profile_id) do nothing;

  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_legal_acceptance
on auth.users;

create trigger on_auth_user_legal_acceptance
after insert on auth.users
for each row
execute function private.record_legal_acceptance();