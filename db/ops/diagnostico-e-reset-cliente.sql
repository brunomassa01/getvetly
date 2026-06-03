-- =====================================================================
-- DIAGNÓSTICO + RESET de um cliente (por e-mail)
-- =====================================================================
-- Uso (no servidor, dentro do psql do banco do getvetly):
--   psql "$DATABASE_URL" -f db/ops/diagnostico-e-reset-cliente.sql
--
-- IMPORTANTE: edite APENAS a linha abaixo com o e-mail do cliente.
-- Tudo é escopado pelo workspace DESSE e-mail. Não toca em outros clientes.
-- =====================================================================

\set email 'cliente@email.com'      -- <<< TROQUE pelo e-mail de login do cliente

-- =====================================================================
-- PARTE 1 — DIAGNÓSTICO (só leitura, pode rodar à vontade)
-- =====================================================================

-- 1) Quem é o usuário, qual workspace e qual papel (admin vs member).
--    Se 'role' não for 'admin', o painel gerencial (chip "Aprovadas",
--    "Aguardando retorno") fica escondido — explica "Aprovadas não aparece".
select u.id            as user_id,
       u.email,
       m.workspace_id,
       w.nome          as empresa,
       m.role,
       m.ativo
from auth.users u
left join workspace_members m on m.user_id = u.id and m.ativo = true
left join workspaces w        on w.id = m.workspace_id
where lower(u.email) = lower(:'email');

-- 2) Propostas do workspace e suas situações comerciais.
--    Se ele "aprovou" mas continua tudo 'em_aberto', a aprovação não marcou
--    nenhuma proposta.
select p.id, p.titulo, p.situacao, p.created_at
from propostas p
join workspace_members m on m.workspace_id = p.workspace_id
where m.user_id = (select id from auth.users where lower(email)=lower(:'email'))
  and m.ativo = true
order by p.created_at desc;

-- 3) Comparativos do workspace (se ele aprovou um COMPARATIVO via link, ele só
--    vira 'apresentada' — NÃO marca proposta como 'aprovada', por design).
select c.id, c.titulo, c.situacao, c.created_at
from comparativos c
join workspace_members m on m.workspace_id = c.workspace_id
where m.user_id = (select id from auth.users where lower(email)=lower(:'email'))
  and m.ativo = true
order by c.created_at desc;

-- 4) Links de compartilhamento criados (proposta vs comparativo, se permite aprovar).
select s.id,
       case when s.proposta_id is not null then 'proposta' else 'comparativo' end as tipo,
       s.permite_aprovar, s.revogado_em, s.created_at
from compartilhamentos s
join workspace_members m on m.workspace_id = s.workspace_id
where m.user_id = (select id from auth.users where lower(email)=lower(:'email'))
  and m.ativo = true
order by s.created_at desc;

-- 5) Aprovações registradas (a decisão chegou a gravar? qual foi?).
select a.decisao, a.revisor_nome, a.created_at
from aprovacoes a
join workspace_members m on m.workspace_id = a.workspace_id
where m.user_id = (select id from auth.users where lower(email)=lower(:'email'))
  and m.ativo = true
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

-- Descobre o workspace do cliente uma vez.
create temporary table _ws on commit drop as
select m.workspace_id as id
from workspace_members m
join auth.users u on u.id = m.user_id
where lower(u.email) = lower(:'email') and m.ativo = true
limit 1;

-- Contagem ANTES (pra você conferir o que será apagado).
select 'propostas'        as tabela, count(*) from propostas        where workspace_id in (select id from _ws)
union all select 'comparativos',     count(*) from comparativos     where workspace_id in (select id from _ws)
union all select 'compartilhamentos',count(*) from compartilhamentos where workspace_id in (select id from _ws)
union all select 'aprovacoes',       count(*) from aprovacoes       where workspace_id in (select id from _ws)
union all select 'fornecedores',     count(*) from fornecedores     where workspace_id in (select id from _ws);

-- Apaga em ordem segura (filhos antes dos pais; comparativos antes de propostas
-- por causa do vencedor_proposta_id, que não tem cascade).
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
