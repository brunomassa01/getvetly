-- =====================================================
-- Migration 0007 — Assinatura (Stripe) por workspace
-- Cada empresa (workspace) tem uma assinatura. Começa em 'trial'
-- (análises grátis); vira 'active' quando paga no Stripe.
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =====================================================

alter table workspaces
  add column if not exists stripe_customer_id text;

alter table workspaces
  add column if not exists stripe_subscription_id text;

-- plano: starter | pro | business | enterprise (null enquanto em trial)
alter table workspaces
  add column if not exists plano text;

-- status: trial | active | past_due | canceled
alter table workspaces
  add column if not exists assinatura_status text not null default 'trial';

-- fim do período pago atual (current_period_end do Stripe)
alter table workspaces
  add column if not exists assinatura_expira_em timestamptz;

create index if not exists idx_workspaces_stripe_customer
  on workspaces(stripe_customer_id);

-- =====================================================
-- FIM da migration 0007
-- =====================================================
