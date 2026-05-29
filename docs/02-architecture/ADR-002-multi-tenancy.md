# ADR-002: Modelo de multi-tenancy — shared database com RLS no Postgres

**Status**: Aceito
**Data**: 2026-05-28
**Decisor**: Bruno Romualdo Marinho

## Contexto

Nosso SaaS atende empresas (tenants) que sao concorrentes entre si — varias agencias de compras, departamentos de procurement de industrias diferentes, fornecedores. Vazamento de dados entre tenants e o risco existencial numero 1: uma proposta de fornecedor da Empresa A nao pode jamais ser visivel para a Empresa B. Esse isolamento precisa ser garantido na camada mais baixa possivel — confiar apenas em filtros do codigo da aplicacao e fragil (um WHERE esquecido vaza tudo).

Ao mesmo tempo, somos um time pequeno operando com orcamento de startup. Provisionar infraestrutura por tenant (banco dedicado, schema dedicado) significa custo crescente linear, migrations N vezes mais lentas, observabilidade fragmentada e DevOps que nao temos. A maioria dos tenants nos primeiros 18 meses sera de empresas pequenas e medias, com volume modesto — nao justifica isolamento fisico.

Premissas: usamos Postgres (via Supabase), que tem RLS (Row-Level Security) maduro e bem testado, com integracao nativa ao Supabase Auth via funcao `auth.uid()` e claims JWT.

## Decisao

Adotamos **shared database, shared schema, com isolamento por Row-Level Security do Postgres**. Toda tabela de dados de cliente tem uma coluna `workspace_id` (UUID, NOT NULL, indexada) referenciando `workspaces.id`. Cada tabela tem politicas RLS ativadas obrigando `workspace_id = (current setting jwt claim workspace_id)`. O `workspace_id` ativo e injetado no JWT da sessao do usuario via custom claims do Supabase Auth, baseado na tabela `workspace_members`. Nada de filtragem confiando apenas no codigo TypeScript — o banco recusa a query.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Shared DB + RLS + workspace_id (escolhida)** | Custo flat; migrations unicas; observabilidade centralizada; RLS do PG e provadamente robusto; pooling de conexao trivial | Bug em politica RLS vaza dados em larga escala; queries precisam sempre carregar workspace_id no plano; "barulho" de tenants grandes pode afetar pequenos |
| **Schema por tenant** | Isolamento logico forte; backup/restore por tenant facil; queries simples (sem WHERE workspace_id) | Migrations multiplicam por N (300 tenants = 300 migrations a aplicar); pg_dump cresce; pool de conexoes vira problema; Supabase nao automatiza |
| **Database por tenant** | Isolamento fisico maximo; data residency por cliente possivel; "blast radius" minimo | Custo cresce linearmente; precisa de orquestracao (Terraform) so para criar tenant; relatorios cross-tenant viram ETL; impraticavel com Supabase free/pro |
| **Isolamento so na aplicacao (WHERE manual no codigo)** | Zero overhead no banco; simples no comeco | Um unico endpoint sem filtro vaza tudo; auditar 100% das queries para sempre e inviavel; RISCO INACEITAVEL para B2B com concorrentes na mesma base |
| **Hibrido: shared para small, dedicated DB para enterprise** | Permite vender SLA premium | Complexidade de codigo e operacional desde o dia 1; cedo demais para nos |

## Consequencias

Positivas:
- Custo de infraestrutura nao cresce por tenant — paga-se por uso real (CPU, storage, conexoes).
- Uma unica suite de migrations, um unico backup, um unico painel de observabilidade.
- RLS funciona mesmo se um endpoint tiver bug — o Postgres recusa retornar linhas alheias.
- Operacao de "adicionar tenant" e simplesmente INSERT em `workspaces` — sem provisionamento.
- Relatorios internos (metricas de produto, billing) sao queries diretas, sem unioes entre bancos.

Negativas / trade-offs aceitos:
- **Toda tabela paga o custo de carregar e indexar `workspace_id`**. Aceitavel — Postgres lida bem.
- **Politicas RLS sao codigo critico** — qualquer mudanca exige revisao paranoica e testes automatizados (test suite dedicada simulando usuarios de tenants diferentes).
- **Vizinho barulhento**: um tenant rodando 10.000 analises pode degradar latencia geral. Mitigacao planejada: queue com prioridade + connection limits por workspace.
- **Cliente regulado pode exigir DB dedicado** — nao atendemos hoje, e isso pode custar deals enterprise. Aceito por agora.
- **Esquecer `BYPASSRLS`** no service role em alguma operacao admin causa bug confuso — documentar bem.

## Quando revisar

- Quando aparecer cliente enterprise pagando 10x ticket medio que exija isolamento fisico contratualmente.
- Quando algum tenant ultrapassar **20% do volume total de queries** — momento de avaliar shard dedicado para ele.
- Se sofrermos qualquer incidente real de vazamento entre tenants (revisao obrigatoria de RLS + auditoria externa).
- Quando o banco Postgres unico passar de **500 GB** ou **10.000 connections concorrentes** — limites praticos para revisitar sharding.
- Se regulacao (LGPD, setor financeiro) exigir data residency por cliente.
