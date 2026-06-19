-- =====================================================
-- Migration 0009 — Origem do cadastro (UTM) no workspace
-- =====================================================
-- Guarda de onde veio cada conta nova (campanha de marketing), pra medir
-- no Admin "quantos cadastros vieram do Google Ads / de cada campanha".
-- São colunas novas numa tabela QUE JÁ EXISTE → herdam os grants de tabela
-- (getvetly_app/getvetly_service já têm acesso). Não precisa novo grant.
-- Idempotente.
-- =====================================================

alter table workspaces add column if not exists utm_source text;
alter table workspaces add column if not exists utm_medium text;
alter table workspaces add column if not exists utm_campaign text;

-- =====================================================
-- FIM da migration 0009
-- =====================================================
