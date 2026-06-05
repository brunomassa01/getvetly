# Como aplicar a migration 0008 (tabela `leads` — CRM de testes)

> **Banco:** PostgreSQL **self-hosted no VPS** (ADR-007) — **não é Supabase**.
> Não tem painel/SQL Editor visual; aplica-se via `psql` no servidor.
>
> **Por que é manual:** o deploy do código (Vercel/VPS) **não roda migration
> sozinho**. Sem aplicar isto, a tela **/admin/crm** dá erro ao cadastrar um
> lead, porque a tabela `leads` ainda não existe.

A migration só **cria uma tabela nova** (`leads`) e dá as permissões dela. Não
altera nem apaga nada do que já existe. É **idempotente** (pode rodar 2x sem
erro).

> ⚠️ **Importante:** rode **como `getvetly_owner`** (o dono das tabelas, que as
> migrations usam) — não como `getvetly_app`/`getvetly_service`. Use o **mesmo
> jeito que você usou pra aplicar as migrations 0001–0007** no VPS.

---

## Passo a passo

### 1. Entrar no VPS por SSH

```bash
ssh seu_usuario@SEU_IP_DO_VPS
```

### 2. Aplicar a migration como `getvetly_owner`

Se o **código está deployado no VPS** (a pasta do projeto com `db/migrations/`):

```bash
cd /var/www/getvetly   # ajuste para o caminho real do projeto no servidor
psql "postgresql://getvetly_owner:SENHA_DO_OWNER@localhost:5432/getvetly" \
  -f db/migrations/0008_leads.sql
```

> A senha do `getvetly_owner` é a que você definiu no setup do Postgres no VPS
> (ADR-007) — **não** é a do `.env.local` (essa é do app/service). Se você
> costuma aplicar migration logado como o usuário `postgres` do sistema, pode
> usar `sudo -u postgres psql -d getvetly -f db/migrations/0008_leads.sql`.

Deve aparecer, sem erro:
```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
ALTER TABLE
GRANT
```

---

## Como saber que deu certo

```bash
psql "postgresql://getvetly_owner:SENHA_DO_OWNER@localhost:5432/getvetly" \
  -c "select count(*) from leads;"
```

Tem que retornar **`0`**, sem erro (a tabela existe, ainda sem leads).

Depois disso, a tela **/admin/crm** já funciona: dá pra cadastrar um lead e
mandar o convite por e-mail ou WhatsApp.

---

## Se aparecer "permission denied for table leads"

A migration já concede o acesso (`grant ... to getvetly_app, getvetly_service`),
então isso não deve acontecer. Mas se acontecer, rode os grants gerais (como
`postgres`) que cobrem todas as tabelas:

```bash
sudo -u postgres psql -d getvetly -f db/grants-selfhosted.sql
```

---

> O SQL oficial e versionado é `db/migrations/0008_leads.sql`. Este arquivo é só
> o **passo a passo** de como aplicá-lo no VPS.
