-- Migração segura e idempotente para contas existentes.
--
-- 1. Execute primeiro a consulta de diagnóstico abaixo.
-- 2. Confirme os UUIDs diretamente no resultado de auth.users.
-- 3. Preencha SOMENTE o mapeamento explícito na tabela temporária.
-- 4. Execute o restante do script.
--
-- Este script não cria, remove ou altera usuários de auth.users e não toca
-- nos registros de treinos, exercícios ou sessões.

select
  u.id as user_id,
  u.email,
  u.raw_user_meta_data ->> 'username' as metadata_username,
  p.username as profile_username,
  p.created_at as profile_created_at
from auth.users u
left join public.profiles p on p.user_id = u.id
order by u.created_at;

-- A tabela temporária existe somente durante esta execução do SQL Editor.
create temporary table profile_username_migration (
  user_id uuid primary key,
  username text not null
) on commit drop;

-- Substitua os valores abaixo pelos UUIDs e usernames confirmados na consulta.
-- Não associe por posição, ordem de cadastro, e-mail presumido ou nome presumido.
--
-- insert into profile_username_migration (user_id, username) values
--   ('UUID_EXISTENTE_1', 'USERNAME_CORRETO_1'),
--   ('UUID_EXISTENTE_2', 'USERNAME_CORRETO_2');

-- Valida o mapeamento antes de qualquer alteração.
do $$
begin
  if exists (
    select 1
    from profile_username_migration m
    where m.user_id is null
      or btrim(m.username) <> m.username
      or char_length(m.username) not between 3 and 30
      or m.username !~ '^[[:alnum:]_.-]+$'
  ) then
    raise exception 'O mapeamento contém UUID ou username inválido.';
  end if;

  if exists (
    select 1
    from profile_username_migration m
    left join auth.users u on u.id = m.user_id
    where u.id is null
  ) then
    raise exception 'O mapeamento contém um user_id que não existe em auth.users.';
  end if;

  if exists (
    select lower(m.username)
    from profile_username_migration m
    group by lower(m.username)
    having count(*) > 1
  ) then
    raise exception 'O mapeamento contém usernames repetidos.';
  end if;

  if exists (
    select 1
    from profile_username_migration m
    join public.profiles p on lower(p.username) = lower(m.username)
      and p.user_id <> m.user_id
  ) then
    raise exception 'Um username já pertence a outro perfil.';
  end if;
end;
$$;

-- Atualiza somente os perfis indicados e cria os que ainda não existem.
insert into public.profiles (user_id, username, updated_at)
select user_id, btrim(username), now()
from profile_username_migration
on conflict (user_id) do update
set username = excluded.username,
    updated_at = now();

-- Confirma o resultado sem expor outros dados além dos necessários.
select
  m.user_id,
  p.username
from profile_username_migration m
join public.profiles p on p.user_id = m.user_id
order by m.user_id;
