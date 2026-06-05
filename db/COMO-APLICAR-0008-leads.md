# Como aplicar a migration 0008 (tabela `leads` — CRM de testes)

> **Por que isso é manual:** o deploy não roda migration sozinho no seu banco.
> Sem aplicar isto, a tela **/admin/crm** vai dar erro ao tentar cadastrar um
> lead, porque a tabela `leads` ainda não existe no banco.

A migration só **cria uma tabela nova** (`leads`). Não altera nem apaga nada
do que já existe — risco praticamente zero. E é **idempotente**: se rodar duas
vezes, não dá erro.

---

## Opção A — Pelo painel do Supabase (mais fácil, recomendado)

1. Entra no **Supabase** → seu projeto.
2. No menu da esquerda, clica em **SQL Editor**.
3. Clica em **+ New query**.
4. **Cola** todo o bloco SQL abaixo.
5. Clica em **Run** (ou Ctrl+Enter).
6. Deve aparecer **"Success. No rows returned"** — pronto.

```sql
-- Migration 0008 — Leads (mini-CRM de prospects no Admin interno)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text,
  observacao text,
  origem text not null default 'admin',
  convidado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Um lead por e-mail (case-insensitive) — evita duplicar o mesmo prospect.
create unique index if not exists idx_leads_email_unico on leads (lower(email));

-- updated_at automático: reusa a função set_updated_at() criada na 0001.
drop trigger if exists trg_leads_updated on leads;
create trigger trg_leads_updated before update on leads
  for each row execute function set_updated_at();

-- RLS: tabela interna, sem política pública. Só o service role acessa.
alter table leads enable row level security;
```

---

## Opção B — Pela CLI (se você usa `supabase` no terminal)

```bash
supabase db push
```

---

## Como saber que deu certo

No **SQL Editor**, roda:

```sql
select * from leads;
```

Tem que retornar **vazio, sem erro** (a tabela existe, ainda sem leads). Ou,
no **Table Editor**, a tabela `leads` aparece na lista.

Depois disso, a tela **/admin/crm** já funciona: dá pra cadastrar um lead e
mandar o convite por e-mail ou WhatsApp.

> Obs.: o conteúdo aqui é uma cópia de `db/migrations/0008_leads.sql` (o
> arquivo oficial e versionado). Se preferir, pode colar o conteúdo de lá.
