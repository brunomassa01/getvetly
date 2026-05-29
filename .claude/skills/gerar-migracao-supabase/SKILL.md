---
name: gerar-migracao-supabase
description: Cria uma nova migration SQL para o Supabase com Row Level Security já configurado, índices recomendados e atualização dos tipos TypeScript. Usa esta skill quando o Bruno disser "cria migration pra adicionar tabela X", "preciso de uma coluna Y na tabela Z", "atualiza o schema pra suportar comparações", "gera a migration de assinaturas", "adiciona índice em created_at", "preciso alterar o enum de status", ou qualquer pedido para mexer no schema do banco.
---

# Gerar Migration Supabase

## Quando esta skill dispara

Dispara quando o Bruno precisa de mudanças no schema do Postgres gerenciado pelo Supabase — nova tabela, nova coluna, novo índice, RLS, função SQL, view.

Frases-gatilho típicas:
- "Cria migration pra adicionar tabela X"
- "Preciso de coluna Y"
- "Atualiza schema pra suportar Z"
- "Adiciona índice em created_at"
- "Gera a migration de assinaturas"
- "Preciso de uma view de propostas analisadas"

## Fluxo passo a passo

### 1. Pensar nas colunas

Antes de escrever SQL, monte uma tabela em texto:

```
proposals
- id              uuid     PK   default gen_random_uuid()
- workspace_id    uuid     FK -> workspaces(id)  NOT NULL
- user_id         uuid     FK -> auth.users(id)  NOT NULL
- title           text                            NOT NULL
- file_url        text                            NOT NULL
- file_size_bytes int                             NOT NULL
- status          proposal_status                 NOT NULL DEFAULT 'pending'
- extracted_text  text
- created_at      timestamptz                     NOT NULL DEFAULT now()
- updated_at      timestamptz                     NOT NULL DEFAULT now()
```

Mostre ao Bruno e confirme antes de gerar SQL.

### 2. Escrever DDL em arquivo numerado

Localização: `db/migrations/NNNN_descricao_curta.sql` (4 dígitos com zero à esquerda).

Estrutura padrão:

```sql
-- 0007_create_proposals.sql
-- Cria tabela de propostas comerciais analisáveis

begin;

-- 1. Enum (se necessário)
create type proposal_status as enum ('pending', 'processing', 'completed', 'failed');

-- 2. Tabela
create table public.proposals (
  id               uuid          primary key default gen_random_uuid(),
  workspace_id     uuid          not null references public.workspaces(id) on delete cascade,
  user_id          uuid          not null references auth.users(id),
  title            text          not null check (length(title) between 1 and 200),
  file_url         text          not null,
  file_size_bytes integer        not null check (file_size_bytes > 0),
  status           proposal_status not null default 'pending',
  extracted_text   text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- 3. Índices
create index proposals_workspace_idx     on public.proposals (workspace_id);
create index proposals_workspace_created on public.proposals (workspace_id, created_at desc);
create index proposals_status_idx        on public.proposals (status) where status in ('pending', 'processing');

-- 4. Trigger de updated_at
create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.tg_set_updated_at();

-- 5. Habilitar RLS
alter table public.proposals enable row level security;

-- 6. Policies
create policy "proposals_select_own_workspace"
  on public.proposals for select
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "proposals_insert_own_workspace"
  on public.proposals for insert
  with check (
    workspace_id = (auth.jwt() ->> 'workspace_id')::uuid
    and user_id = auth.uid()
  );

create policy "proposals_update_own_workspace"
  on public.proposals for update
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  with check (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "proposals_delete_own_workspace"
  on public.proposals for delete
  using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

commit;
```

### 3. Escrever rollback (down migration opcional)

Para migrations destrutivas (drop, alter), gere `db/migrations/down/NNNN_descricao_curta.down.sql`:

```sql
-- 0007_create_proposals.down.sql
begin;
drop table if exists public.proposals;
drop type if exists proposal_status;
commit;
```

Migrations puramente aditivas podem dispensar rollback se o Bruno confirmar.

### 4. Aplicar no Supabase via CLI

```bash
supabase db push
# ou em dev local:
supabase migration up
```

Se der erro, **leia o output completo**, ajuste o SQL e tente de novo. Nunca edite uma migration que já rodou em produção — crie outra que corrige.

### 5. Atualizar tipos TypeScript

```bash
supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Verifique se o git diff faz sentido — tabela nova aparece, colunas removidas somem.

### 6. Confirmar e commitar

Commit message:

```
db(proposals): cria tabela proposals com RLS por workspace

- Enum proposal_status
- Indices em workspace_id e (workspace_id, created_at)
- Policies select/insert/update/delete por workspace_id
- Atualiza database.types.ts
```

## Regras

### Padrões obrigatórios em TODA tabela de negócio

- `id uuid primary key default gen_random_uuid()`
- `workspace_id uuid not null references workspaces(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` + trigger
- RLS **habilitado** (`alter table ... enable row level security`)
- **Quatro policies separadas**: SELECT, INSERT, UPDATE, DELETE — nunca uma única `FOR ALL`
- Índice em `workspace_id` (todo SELECT filtra por ele)

### Convenções de nomes

- Tabelas: `snake_case` plural (`proposals`, `audit_logs`, `subscriptions`)
- Colunas: `snake_case` (`workspace_id`, `created_at`)
- Enums: `snake_case` singular (`proposal_status`, `user_role`)
- Índices: `<tabela>_<colunas>_idx` (`proposals_workspace_idx`)
- Policies: `<tabela>_<acao>_<criterio>` (`proposals_select_own_workspace`)
- Funções: `snake_case` com prefixo de domínio (`tg_set_updated_at`, `fn_workspace_seats_used`)

### Helper de updated_at

Crie uma vez (na migration 0001 ou similar):

```sql
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Depois é só `create trigger ... execute function public.tg_set_updated_at();` em cada tabela.

### Índices comuns

- `(workspace_id)` — sempre
- `(workspace_id, created_at desc)` — listas paginadas
- `(workspace_id, status) where status in (...)` — filas de trabalho (parcial)
- `(file_url)` se for buscar por hash
- Unique em `(workspace_id, slug)` quando aplicável

### RLS — armadilhas

- `auth.jwt() ->> 'workspace_id'` retorna **text** — precisa de cast `::uuid`.
- `auth.uid()` já é `uuid`.
- Policy `for insert` usa `with check`, não `using`.
- Policy `for update` precisa **dos dois** (`using` + `with check`) para impedir mudar `workspace_id` num update.
- Service role bypassa RLS — code de backend que usa service key precisa filtrar manualmente.

### Migrations destrutivas

- **Não dropa coluna em produção sem aviso** — adicione `deprecated_at`, deixe deprecada por 1 release, depois drop.
- **Não renomeia coluna direto** — adiciona nova, backfill, deprecate antiga, drop depois.
- **Sempre `begin; ... commit;`** para atomicidade.

## Exemplos práticos

### Exemplo 1: adicionar coluna `tags text[]` em proposals

```sql
-- 0014_add_tags_to_proposals.sql
begin;
alter table public.proposals add column tags text[] not null default '{}';
create index proposals_tags_gin on public.proposals using gin (tags);
commit;
```

### Exemplo 2: nova tabela de comparações

Tabela `comparisons` que agrupa N propostas. Inclui:
- FK para `workspaces`
- Coluna `proposal_ids uuid[]` ou tabela join `comparison_proposals`
- RLS por workspace
- Índice em `workspace_id` e `created_at`

### Exemplo 3: enum novo de plano

```sql
-- 0009_add_enterprise_plan.sql
begin;
alter type subscription_plan add value if not exists 'enterprise';
commit;
```

Atenção: `alter type ... add value` **não roda dentro de transação** em algumas versões — pode precisar de `commit;` no meio. Teste em dev primeiro.

## O que NÃO fazer

- **Não esqueça `enable row level security`** — RLS desligado = vazamento.
- **Não use `for all` em policy** — separe por ação para auditar.
- **Não esqueça `with check` em update** — usuário pode "transferir" registro pra outro workspace.
- **Não rode migration manualmente no SQL Editor do Supabase em produção** — sempre via CLI versionado.
- **Não edite migration que já rodou em prod** — crie outra que corrige.
- **Não use `serial`/`bigserial`** — sempre `uuid` (escala, não vaza ordem).
- **Não esqueça índice em `workspace_id`** — toda query filtra por ele, sem índice fica lento.
- **Não use `cascade` agressivo sem pensar** — entender o que será deletado em cadeia.
- **Não esqueça de rodar `supabase gen types`** — TypeScript fica desatualizado e quebra em runtime.
- **Não commite migration sem testar localmente** — `supabase db reset` + `migration up` para validar do zero.
