-- =====================================================
-- GRANTS — PostgreSQL self-hosted (ADR-007)
-- =====================================================
-- Rodar DEPOIS das migrations 0001 e 0002, como usuário postgres.
-- Define quem pode o quê:
--   getvetly_app     → respeita RLS (app normal)
--   getvetly_service → ignora RLS via BYPASSRLS (worker, rotas públicas)
--
-- IMPORTANTE: getvetly_app NUNCA é dono das tabelas e NÃO tem
-- BYPASSRLS — é por isso que o RLS é aplicado a ele.
-- =====================================================

-- Acesso aos schemas
grant usage on schema public, auth to getvetly_app, getvetly_service;

-- =====================================================
-- getvetly_app — DML em tudo, mas sujeito ao RLS
-- =====================================================
grant select, insert, update, delete on all tables in schema public to getvetly_app;
grant select, insert, update, delete on all tables in schema auth   to getvetly_app;
grant usage, select on all sequences in schema public to getvetly_app;
grant usage, select on all sequences in schema auth   to getvetly_app;
grant execute on all functions in schema auth to getvetly_app;

-- futuras tabelas/sequences herdam os grants
alter default privileges in schema public grant select, insert, update, delete on tables to getvetly_app;
alter default privileges in schema auth   grant select, insert, update, delete on tables to getvetly_app;
alter default privileges in schema public grant usage, select on sequences to getvetly_app;

-- =====================================================
-- getvetly_service — mesmo acesso; BYPASSRLS é atributo do role
-- (definido no CREATE ROLE, ver ADR-007 / setup)
-- =====================================================
grant select, insert, update, delete on all tables in schema public to getvetly_service;
grant select, insert, update, delete on all tables in schema auth   to getvetly_service;
grant usage, select on all sequences in schema public to getvetly_service;
grant usage, select on all sequences in schema auth   to getvetly_service;
grant execute on all functions in schema auth to getvetly_service;

alter default privileges in schema public grant select, insert, update, delete on tables to getvetly_service;
alter default privileges in schema auth   grant select, insert, update, delete on tables to getvetly_service;
alter default privileges in schema public grant usage, select on sequences to getvetly_service;

-- =====================================================
-- FIM dos grants.
-- =====================================================
