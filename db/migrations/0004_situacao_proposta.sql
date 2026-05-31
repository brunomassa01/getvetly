-- =====================================================
-- Migration 0004 — Situação comercial da proposta
-- Ciclo: em_aberto → apresentada → aprovada | recusada
-- (separado do pipeline de análise, que vive em propostas.status)
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================

alter table propostas
  add column if not exists situacao text not null default 'em_aberto';

alter table propostas
  add column if not exists apresentada_em timestamptz;

alter table propostas
  add column if not exists decidida_em timestamptz;

-- Acelera o painel ("aguardando retorno" e contagens por situação).
create index if not exists idx_propostas_situacao on propostas(situacao);

-- =====================================================
-- FIM da migration 0004
-- =====================================================
