-- =====================================================
-- Migration 0008 — Leads (mini-CRM de prospects no Admin interno)
-- =====================================================
-- Esta tabela é o FUNIL DE PROSPECTS do dono (não é dado de um cliente).
-- Por isso, diferente das demais, NÃO tem workspace_id — igual às métricas
-- do admin, ela é global ao negócio. O acesso é só do admin interno.
--
-- Segurança: RLS habilitado e SEM nenhuma política → nenhum usuário comum
-- enxerga ou escreve nada. Só o service role (usado pelo admin interno via
-- getSqlService) ignora RLS e acessa. Defense in depth: o código também checa
-- ehEmailInterno() antes de qualquer operação.
--
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text,
  observacao text,
  origem text not null default 'admin',  -- de onde veio o lead (admin, site, etc.)
  convidado_em timestamptz,               -- quando o convite de teste foi enviado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Um lead por e-mail (case-insensitive) — evita duplicar o mesmo prospect.
create unique index if not exists idx_leads_email_unico on leads (lower(email));

-- updated_at automático: reusa a função set_updated_at() criada na 0001.
drop trigger if exists trg_leads_updated on leads;
create trigger trg_leads_updated before update on leads
  for each row execute function set_updated_at();

-- RLS: tabela interna, sem política pública. Só o service role acessa.
alter table leads enable row level security;

-- Permissões (self-hosted, ADR-007): a tabela é criada por getvetly_owner.
-- As default privileges do grants-selfhosted.sql cobrem tabelas criadas pelo
-- postgres, não pelo owner — então concedemos acesso explicitamente aqui.
-- O CRM acessa via getvetly_service (BYPASSRLS); getvetly_app fica sujeito ao
-- RLS (sem política = sem linhas), seguindo o mesmo padrão das demais tabelas.
grant select, insert, update, delete on leads to getvetly_app, getvetly_service;

-- =====================================================
-- FIM da migration 0008
-- =====================================================
