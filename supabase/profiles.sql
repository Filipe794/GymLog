-- Execute no SQL Editor do Supabase para adicionar perfis a um projeto existente.
-- O trigger usa os metadados enviados no signUp e funciona mesmo sem sessão
-- quando a confirmação de e-mail está habilitada.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username = btrim(username) and char_length(username) between 3 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create or replace function public.is_username_available(candidate_username text)
returns boolean
language sql
security definer set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(btrim(candidate_username))
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_username text := btrim(new.raw_user_meta_data ->> 'username');
begin
  if new_username is null or new_username = '' then
    raise exception 'username_required';
  end if;

  insert into public.profiles (user_id, username)
  values (new.id, new_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;

drop policy if exists "Users read their profile" on public.profiles;
create policy "Users read their profile"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
