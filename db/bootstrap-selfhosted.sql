-- =====================================================
-- BOOTSTRAP — PostgreSQL self-hosted (ADR-007)
-- =====================================================
-- Recria o que o Supabase fornecia nativamente, para que as
-- migrations 0001 e 0002 rodem SEM ALTERAÇÃO em Postgres puro.
--
-- ORDEM DE EXECUÇÃO (no VPS, como usuário postgres):
--   1. Criar roles + database (ver docs/02-architecture/ADR-007)
--   2. Rodar ESTE arquivo (conectado ao banco getvetly, como postgres)
--   3. Rodar db/migrations/0001_initial_schema.sql (como getvetly_owner)
--   4. Rodar db/migrations/0002_rls_policies.sql   (como getvetly_owner)
--   5. Rodar db/grants-selfhosted.sql              (como postgres)
-- =====================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- SCHEMA auth — substitui o schema auth do Supabase
-- =====================================================
create schema if not exists auth;

-- =====================================================
-- auth.users — tabela de usuários (Auth.js grava aqui)
-- As FKs das migrations (workspace_members.user_id,
-- propostas.criado_por, etc.) apontam para esta tabela.
-- =====================================================
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  email_verificado_em timestamptz,
  senha_hash text,                          -- null se login só por magic link
  nome text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- auth.sessions — sessões do Auth.js
-- =====================================================
create table if not exists auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expira_em timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_sessions_user on auth.sessions(user_id);
create index if not exists idx_auth_sessions_token on auth.sessions(token);

-- =====================================================
-- auth.uid() — substitui a função do Supabase.
-- Lê o ID do usuário logado de uma variável de sessão que o
-- app Next.js define a cada requisição autenticada com:
--   select set_config('app.current_user_id', '<uuid>', true);
-- Em contexto de service role (BYPASSRLS) a variável não é
-- setada e a função retorna null — sem problema, pois o RLS
-- é ignorado para esse papel.
-- =====================================================
create or replace function auth.uid()
returns uuid as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$ language sql stable;

-- =====================================================
-- Trigger updated_at para auth.users (auto-contido,
-- independente da função set_updated_at() da migration 0001)
-- =====================================================
create or replace function auth.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auth_users_updated on auth.users;
create trigger trg_auth_users_updated before update on auth.users
  for each row execute function auth.set_updated_at();

-- =====================================================
-- FIM do bootstrap.
-- Próximo: rodar migrations 0001 e 0002 (como getvetly_owner).
-- =====================================================
