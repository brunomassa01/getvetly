-- =====================================================
-- Migration 0003: Tokens de recuperação de senha
-- =====================================================
-- Suporta o fluxo "esqueci minha senha".
-- Guardamos o HASH do token (sha256), nunca o token cru — se o banco
-- vazar, os tokens não são utilizáveis.
-- Rodar como postgres (owner), depois das migrations 0001/0002.
-- =====================================================

create table if not exists auth.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  usado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_user on auth.password_reset_tokens(user_id);
create index if not exists idx_password_reset_hash on auth.password_reset_tokens(token_hash);

-- =====================================================
-- FIM da migration 0003
-- =====================================================
