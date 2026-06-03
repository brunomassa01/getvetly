-- =====================================================================
-- DIAGNÓSTICO + RESET de um cliente (pelo NOME da empresa)
-- =====================================================================
-- Uso (no servidor, dentro do psql do banco do getvetly):
--   psql "$DATABASE_URL" -f db/ops/diagnostico-e-reset-cliente.sql
--
-- IMPORTANTE: edite APENAS a linha abaixo com o NOME da empresa (igual ao
-- que aparece no painel admin → "Empresas recentes"). Ex.: 'Tiago Massa'.
-- Tudo é escopado por esse workspace. Não toca em outros clientes.
-- =====================================================================

\set empresa 'Tiago Massa'      -- <<< TROQUE pelo nome da empresa do cliente

-- =====================================================================
-- PARTE 1 — DIAGNÓSTICO (só leitura, pode rodar à vontade)
-- =====================================================================

-- 1) A empresa, o(s) usuário(s), e-mail(s) e papel (admin vs member).
--    Se o dono não for 'admin', o painel gerencial (chip "Aprovadas",
--    "Aguardando retorno") fica escondido.
select w.id as workspace_id, w.nome as empresa,
       u.email, m.role, m.ativo, m.created_at
from workspaces w
join workspace_members m on m.workspace_id = w.id
join auth.users u        on u.id = m.user_id
where lower(btrim(w.nome)) = lower(btrim(:'empresa'))
order by (m.role = 'admin') desc, m.created_at asc;

-- 2) Propostas da empresa e suas situações comerciais.
--    Se ele "aprovou" mas continua tudo 'em_aberto', a aprovação não marcou
--    nenhuma proposta.
select p.id, p.titulo, p.situacao, p.created_at
from propostas p
join workspaces w on w.id = p.workspace_id
where lower(btrim(w.nome)) = lower(btrim(:'empresa'))
order by p.created_at desc;

-- 3) Comparativos (concorrências) da empresa, e qual a proposta escolhida.
--    Se ele aprovou pelo link SEM ter escolhido a vencedora, antes do ajuste
--    nada virava 'aprovada'.
select c.id, c.titulo, c.situacao, c.proposta_escolhida_id, c.created_at
from comparativos c
join workspaces w on w.id = c.workspace_id
where lower(btrim(w.nome)) = lower(btrim(:'empresa'))
order by c.created_at desc;

-- 4) Links de compartilhamento criados (proposta vs comparativo).
select s.id,
       case when s.proposta_id is not null then 'proposta' else 'comparativo' end as tipo,
       s.permite_aprovar, s.revogado_em, s.created_at
from compartilhamentos s
join workspaces w on w.id = s.workspace_id
where lower(btrim(w.nome)) = lower(btrim(:'empresa'))
order by s.created_at desc;

-- 5) Aprovações registradas (a decisão chegou a gravar? qual foi?).
select a.decisao, a.revisor_nome, a.created_at
from aprovacoes a
join workspaces w on w.id = a.workspace_id
where lower(btrim(w.nome)) = lower(btrim(:'empresa'))
order by a.created_at desc;

-- =====================================================================
-- PARTE 2 — RESET (APAGA os dados de teste do cliente)
-- =====================================================================
-- Roda dentro de uma transação. Por padrão NÃO confirma (faz ROLLBACK no fim)
-- para você revisar as contagens com segurança. Quando estiver certo,
-- troque a última linha 'ROLLBACK;' por 'COMMIT;' e rode de novo.
--
-- NÃO apaga: a conta (auth.users), o workspace, nem a associação/papel.
-- Apaga só o CONTEÚDO de teste: propostas, análises, comparativos,
-- compartilhamentos, aprovações, anotações e fornecedores.
-- =====================================================================

begin;

-- Descobre o workspace do cliente uma vez (pelo nome).
create temporary table _ws on commit drop as
select id from workspaces
where lower(btrim(nome)) = lower(btrim(:'empresa')) limit 1;

-- Contagem ANTES (pra você conferir o que será apagado).
select 'propostas'        as tabela, count(*) from propostas        where workspace_id in (select id from _ws)
union all select 'comparativos',     count(*) from comparativos     where workspace_id in (select id from _ws)
union all select 'compartilhamentos',count(*) from compartilhamentos where workspace_id in (select id from _ws)
union all select 'aprovacoes',       count(*) from aprovacoes       where workspace_id in (select id from _ws)
union all select 'fornecedores',     count(*) from fornecedores     where workspace_id in (select id from _ws);

-- Apaga em ordem segura (filhos antes dos pais; comparativos antes de propostas
-- por causa do proposta_escolhida_id/vencedor, que não tem cascade).
delete from analise_edicoes   where workspace_id in (select id from _ws);
delete from anotacoes         where workspace_id in (select id from _ws);
delete from aprovacoes        where workspace_id in (select id from _ws);
delete from compartilhamentos where workspace_id in (select id from _ws);
delete from analises          where workspace_id in (select id from _ws);
delete from proposta_arquivos where workspace_id in (select id from _ws);
delete from comparativos      where workspace_id in (select id from _ws);
delete from propostas         where workspace_id in (select id from _ws);
delete from fornecedores      where workspace_id in (select id from _ws);

-- Zera os contadores de uso (cota), pra ele recomeçar do zero.
delete from workspace_uso     where workspace_id in (select id from _ws);

-- Contagem DEPOIS (deve ser tudo 0).
select 'propostas'        as tabela, count(*) from propostas        where workspace_id in (select id from _ws)
union all select 'comparativos',     count(*) from comparativos     where workspace_id in (select id from _ws)
union all select 'fornecedores',     count(*) from fornecedores     where workspace_id in (select id from _ws);

-- >>> Por segurança, termina sem confirmar. Reveja as contagens acima.
-- >>> Quando estiver certo, troque a linha abaixo para:  commit;
rollback;
