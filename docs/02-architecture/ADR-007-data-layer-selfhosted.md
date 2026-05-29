# ADR-007: Camada de dados — PostgreSQL self-hosted no VPS (substitui Supabase)

**Status**: Aceito
**Data**: 2026-05-29
**Decisor**: Bruno Romualdo Marinho
**Substitui**: A parte de banco/auth/storage do ADR-001 (que adotava Supabase)

## Contexto

O ADR-001 adotou Supabase (Postgres gerenciado + Auth + Storage + RLS). Ao iniciar o setup, a conta do Bruno atingiu o limite de projetos gratuitos do Supabase (2 por organização), então o free tier não está mais disponível. As opções eram: pagar Supabase Pro (~R$140/mês), usar Neon (Postgres gerenciado free, sem auth/storage), ou self-hospedar Postgres no VPS Hostinger KVM1 que já foi pago (ADR-006) e está praticamente ocioso.

A restrição central do projeto é **custo máximo de $50/mês**. O VPS já está pago e tem capacidade ociosa (4GB RAM, 50GB disco).

## Decisão

Self-hospedar **PostgreSQL 16** no próprio VPS. Custo adicional: **R$ 0**.

| Função | Antes (Supabase) | Agora (self-hosted) |
|---|---|---|
| Banco de dados | Supabase Postgres | PostgreSQL 16 no VPS |
| Autenticação | Supabase Auth (gotrue) | **Auth.js (NextAuth v5)** — sessões no Postgres |
| Storage de arquivos | Supabase Storage | **Disco do VPS** (MVP) → Cloudflare R2 (10GB free) quando crescer |
| RLS | Postgres (via Supabase) | **PostgreSQL puro** (mesma tecnologia) |
| Backups | Automático (Supabase Pro) | **pg_dump diário** via cron + cópia offsite |

## Como o RLS continua funcionando sem Supabase

As migrations `0001` e `0002` dependem de três coisas que o Supabase fornecia. Recriamos todas no script `db/bootstrap-selfhosted.sql`, que roda **uma vez, antes das migrations**:

1. **Schema `auth` + tabela `auth.users`** — as chaves estrangeiras (`workspace_members.user_id`, `propostas.criado_por`, etc.) continuam válidas. O Auth.js grava os usuários aqui.

2. **Função `auth.uid()`** — em vez de ler de um JWT do gotrue, lê de uma variável de sessão do Postgres que o app define a cada requisição:
   ```sql
   create function auth.uid() returns uuid as $$
     select nullif(current_setting('app.current_user_id', true), '')::uuid;
   $$ language sql stable;
   ```
   O código Next.js, após autenticar a sessão, roda `select set_config('app.current_user_id', '<id>', true)` antes das queries. O RLS então filtra normalmente.

3. **Service role** — em vez do `service_role` do Supabase, criamos um papel Postgres dedicado `getvetly_service` com `BYPASSRLS`. Usado pelo worker de IA e pelas rotas públicas validadas por token (`/r/[token]`). O app normal conecta com o papel `getvetly_app`, que **respeita** o RLS.

**As migrations 0001 e 0002 não mudam.** Continuam portáveis para Supabase no futuro.

## Papéis (roles) do Postgres

| Papel | RLS | Usado por |
|---|---|---|
| `getvetly_owner` | dono das tabelas | migrations e manutenção |
| `getvetly_app` | **respeita RLS** | app Next.js (queries normais do usuário) |
| `getvetly_service` | **BYPASSRLS** | worker de IA, rotas públicas validadas, telemetria |

`getvetly_app` nunca é dono das tabelas e não tem BYPASSRLS — por isso o RLS é aplicado a ele.

## Autenticação — Auth.js (NextAuth v5)

- Provider inicial: **e-mail + senha** (credentials) e/ou **magic link** por e-mail (via Resend)
- Sessões persistidas no Postgres (tabela em `auth`)
- Senha com hash bcrypt/argon2
- Substitui templates de e-mail do Supabase pelos do Resend (já planejado)

## Storage de arquivos

- **MVP**: arquivos salvos no disco do VPS em `/var/www/getvetly/storage/` (50GB cobrem muito tempo)
- **Quando crescer**: migrar para Cloudflare R2 (10GB grátis, sem custo de egress) — abstração de storage no código facilita a troca
- Backups: incluir a pasta de storage no script de backup semanal

## Backups (responsabilidade agora é nossa)

```bash
# cron diário às 3h — pg_dump + retenção de 7 dias
0 3 * * * pg_dump getvetly | gzip > /var/backups/getvetly/db_$(date +\%F).sql.gz
# limpeza: manter só os últimos 7
find /var/backups/getvetly -name "db_*.sql.gz" -mtime +7 -delete
```

Cópia offsite semanal para Cloudflare R2 ou Google Drive (a definir).

## Consequências

**Positivas:**
- Custo do banco: R$ 0 (vs R$140/mês Supabase Pro)
- Controle total, sem limite de projetos, sem pausa por inatividade
- Schema e RLS preservados — zero retrabalho nas migrations
- Latência mínima: banco e app no mesmo servidor

**Negativas / trade-offs aceitos:**
- **Somos o DBA**: backups, updates de segurança e tuning são nossa responsabilidade (mitigado por cron + monitoramento)
- **Auth e Storage precisam ser construídos** (Auth.js + abstração de storage) — esforço único, feito durante o desenvolvimento
- **Ponto único de falha**: app + banco no mesmo VPS. Se o servidor cair, tudo cai. Aceitável no MVP; revisar ao escalar
- **Sem dashboard visual** do Supabase — usar `psql`/ferramenta externa quando necessário

## Quando revisar

- Se o banco passar de ~20GB ou exigir réplica de leitura → mover para servidor de banco dedicado ou Neon/RDS
- Se precisarmos de alta disponibilidade (cliente enterprise com SLA) → separar app e banco
- Se a carga do Postgres competir com o Next.js por RAM no KVM1 → upgrade para KVM2 (8GB)

## Arquivos relacionados

- `db/bootstrap-selfhosted.sql` — adaptador que recria auth schema, auth.users, auth.uid() e roles
- `db/migrations/0001_initial_schema.sql` — schema (inalterado)
- `db/migrations/0002_rls_policies.sql` — RLS (inalterado)
- ADR-006 — servidor VPS Hostinger
