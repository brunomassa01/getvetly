-- =====================================================
-- Migration 0006 — Telefone no perfil do usuário (tela "Conta")
-- auth.users já tem nome e avatar_url (foto); falta só o telefone.
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================

alter table auth.users
  add column if not exists telefone text;

-- =====================================================
-- FIM da migration 0006
-- =====================================================
