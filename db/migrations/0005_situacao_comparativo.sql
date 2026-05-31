-- =====================================================
-- Migration 0005 — Situação/decisão da comparação
-- Cada comparação é independente: guarda sua própria situação,
-- datas e qual proposta foi a escolhida (uma proposta pode estar
-- em várias comparações, cada uma com seu próprio desfecho).
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================

alter table comparativos
  add column if not exists situacao text not null default 'em_aberto';

alter table comparativos
  add column if not exists apresentado_em timestamptz;

alter table comparativos
  add column if not exists decidido_em timestamptz;

alter table comparativos
  add column if not exists proposta_escolhida_id uuid
  references propostas(id) on delete set null;

create index if not exists idx_comparativos_situacao
  on comparativos(situacao);

-- =====================================================
-- FIM da migration 0005
-- =====================================================
