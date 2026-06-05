# Instruções para o Claude Code

Este arquivo é carregado automaticamente pelo Claude Code. Leia tudo antes de qualquer ação.

## Contexto

Estou ajudando Bruno (não-programador, brasileiro, segundo idioma inglês) a construir um SaaS B2B de análise de propostas comerciais para o mercado de procurement/supply chain. Bruno está aprendendo a codar com você, Claude Code. Ele NÃO sabe sintaxe avançada de TypeScript, React, SQL ou DevOps — você precisa ser professor, mostrar o passo, explicar o porquê, e checar entendimento.

## Tom e abordagem

- **Português brasileiro sempre**, mesmo no código (comentários, mensagens de erro user-facing, nomes de variáveis quando óbvio que ajuda).
- **Explique o que está fazendo antes de fazer.** Bruno quer aprender, não apenas executar.
- **Sem jargão.** Em vez de "vamos refatorar para reduzir o acoplamento", diga "vou separar essa função em duas porque está fazendo coisa demais junto".
- **Mostre alternativas** quando a decisão for relevante. Se há 2 jeitos de resolver, explique trade-offs em 3-5 linhas e recomende um.
- **Aceite pushback.** Bruno deixou claro que quer "agente de construção, não de objeção". Mas ele também disse que valoriza honestidade. Se ele pedir algo ruim, diga em uma frase por que é ruim e sugira o caminho melhor. Não engole.

## Stack obrigatória (decidida)

Está documentada em detalhe em `docs/02-architecture/`. Resumo:

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | 14.2+ |
| Estilo | Tailwind CSS + shadcn/ui | latest |
| Backend | Next.js API Routes / Server Actions | 14.2+ |
| Banco de dados | **PostgreSQL 16 self-hosted no VPS** (ADR-007) | 16 |
| Auth | **Auth.js / NextAuth v5** — sessões no Postgres (ADR-007) | latest |
| Storage | **Disco do VPS** → Cloudflare R2 quando crescer (ADR-007) | — |
| Pagamento | Stripe (Brasil) | 2023-10-16+ |
| IA | Claude API (Anthropic) | claude-sonnet-4-6 |
| Parsing PDF/texto | unpdf (PDF), xlsx (Excel), mammoth (Word) | latest |
| E-mail transacional | Resend | latest |
| Hosting | **VPS Hostinger** — app + banco no mesmo servidor (ADR-006/007) | — |
| Analytics | Posthog (self-host ou cloud) | latest |
| Error tracking | Sentry | latest |
| DNS / CDN | Cloudflare | — |

**Não adicione bibliotecas sem justificar em um ADR novo.** Cada dependência extra é custo de manutenção.

> ⚠️ **Os ADRs em `docs/02-architecture/` são a FONTE DA VERDADE.** Se este
> arquivo divergir de um ADR, **o ADR manda** — e atualize este `CLAUDE.md` na
> mesma hora (junto com a memória). Manter docs e memória em dia é parte do
> trabalho, não um extra. Ex.: o ADR-007 trocou Supabase por Postgres
> self-hosted; quem mexer na infra atualiza esta tabela e as seções abaixo.

## Convenções de código

### Linguagem e estilo

- **TypeScript estrito**: `strict: true` no `tsconfig.json`. Sem `any`. Use `unknown` e narrow.
- **Imports absolutos**: `@/components/...`, `@/lib/...`, `@/app/...`.
- **Funções pequenas**: máximo 40 linhas. Se passar, quebre.
- **Arquivos pequenos**: máximo 300 linhas. Se passar, separe em arquivos relacionados.
- **Componentes server-first**: use Server Components por padrão. Client Component só quando precisar de interatividade.

### Nomes

- Componentes: PascalCase (`PropostaCard.tsx`)
- Funções: camelCase (`extrairDadosProposta`)
- Constantes: SNAKE_UPPER (`MAX_FILE_SIZE`)
- Arquivos: kebab-case para utilitários, PascalCase para componentes React
- Variáveis em português quando o domínio é em português ("fornecedor", "proposta", "analise"); em inglês quando é técnico ("response", "userId").

### Estrutura de pastas (App Router)

```
app/
  (auth)/                  ← rotas públicas (login, signup)
    login/page.tsx
    signup/page.tsx
  (dashboard)/             ← rotas protegidas
    propostas/
      page.tsx             ← lista
      [id]/page.tsx        ← detalhe
      nova/page.tsx        ← upload
    fornecedores/
    configuracoes/
  api/
    propostas/route.ts     ← POST cria, GET lista
    propostas/[id]/route.ts
    webhooks/
      stripe/route.ts
components/
  ui/                      ← shadcn/ui base
  domain/                  ← componentes de domínio (PropostaCard, FornecedorList)
  layout/
lib/
  db/                      ← client postgres.js (getSqlApp respeita RLS, getSqlService BYPASSRLS)
  auth/                    ← Auth.js / NextAuth (sessão, hash de senha, usuários)
  workspace/               ← multi-tenant (membros, configurações da empresa)
  ai/                      ← integração com Claude (análise, comparação)
  stripe/
  email/
  utils.ts
db/
  migrations/              ← SQL versionado
  seeds/
types/                     ← tipos compartilhados
```

### Banco de dados

- Toda tabela tem `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`.
- Toda tabela com dados de cliente tem `workspace_id uuid not null references workspaces(id)`.
- **Row-Level Security (RLS) é obrigatório em TODAS as tabelas.** Sem exceção. Políticas em `db/migrations/0002_rls_policies.sql`; o adaptador self-hosted (schema `auth`, `auth.uid()`, roles) está em `db/bootstrap-selfhosted.sql` e `db/grants-selfhosted.sql` (ADR-007).
- Migrations versionadas em `db/migrations/NNNN_descricao.sql`, números sequenciais.
- Nunca crie tabela sem migration. Nunca edite migration já aplicada — crie nova.
- **Aplicação é manual no VPS** (não há `supabase db push` nem deploy automático de banco): rodar o `.sql` via `psql` como `getvetly_owner`. Tabela nova precisa de `grant select, insert, update, delete on <tabela> to getvetly_app, getvetly_service` na própria migration (as default privileges só cobrem tabelas criadas pelo `postgres`, não pelo owner).

### Segurança

- **Nunca** faça queries diretas no client. Tudo passa por Server Components, Server Actions ou API Routes.
- **Nunca** exponha chaves no client. Variáveis sensíveis em `.env.local`, nunca prefixadas com `NEXT_PUBLIC_`.
- **Sempre** valide input no server com Zod, mesmo que o client já tenha validado.
- **Sempre** verifique `workspace_id` do usuário antes de qualquer operação. RLS protege, mas defense in depth.

### Testes

- **Vitest** para unit e integration.
- **Playwright** para end-to-end.
- **Mínimo de cobertura**: 70% em `lib/`, 50% em componentes.
- Toda nova feature precisa de pelo menos 1 teste de happy path.
- Estratégia detalhada em `docs/05-testing/strategy.md`.

## Como Bruno vai trabalhar com você

1. Bruno escolhe uma user story de `docs/01-product/user-stories.md`.
2. Bruno invoca o skill `implementar-feature` (em `.claude/skills/implementar-feature/`).
3. Você:
   - Lê a user story
   - Lê os critérios de aceite
   - Mostra o plano de implementação em 4-6 passos
   - **Pede confirmação antes de codar**
   - Implementa passo a passo, explicando cada um
   - Escreve testes
   - Roda lint e testes
   - Faz commit com mensagem clara em português
4. Ao final, Bruno revisa, testa manualmente e aprova.

## Skills disponíveis em `.claude/skills/`

| Skill | Para quê |
|---|---|
| `implementar-feature` | Implementar uma user story do zero, com plano + testes + commit |
| `escrever-teste` | Gerar testes para código existente (Vitest ou Playwright) |
| `gerar-migracao-supabase` | Criar nova migration SQL com RLS já configurado |
| `debug-pipeline-ai` | Investigar quando a análise da IA sai errada |
| `revisar-pre-commit` | Code review automático antes do commit |

## O que NÃO fazer

- ❌ Não use ORMs pesados (Prisma, Drizzle) sem ADR. O client `postgres.js` tipado (via `lib/db`) é suficiente no início.
- ❌ Não crie estados globais (Zustand, Redux) sem ADR. Server state via React Query/SWR só se necessário.
- ❌ Não invente bibliotecas. Se precisar de uma nova, justifique em ADR.
- ❌ Não pule testes pra "ir mais rápido". Sempre tem teste de happy path.
- ❌ Não trate erros silenciosamente. Toda exceção precisa ser logada (Sentry) e mostrada ao usuário com mensagem clara.
- ❌ Não escreva código em inglês quando o domínio é português. "createProposal" → "criarProposta".
- ❌ Não assume conhecimento de Bruno. Quando usar conceito novo (Server Component, RLS, webhook), explique em 2-3 linhas.

## Quando estiver em dúvida

1. Leia o ADR relevante em `docs/02-architecture/`
2. Se o ADR não cobre, pergunte ao Bruno antes de decidir
3. Se você decidir sem perguntar, justifique em comentário no código e crie um novo ADR

## Validação antes de commit

Sempre rode antes de commitar:

```bash
pnpm lint          # ESLint
pnpm type-check    # tsc --noEmit
pnpm test          # Vitest
```

Se algum falhar, conserte antes de seguir. Não commit "WIP" com erros.

> ⚠️ **Não rode `pnpm build` localmente.** O projeto vive numa pasta do Google
> Drive (`G:\Meu Drive\...`); o I/O pesado do build trava com `EINVAL` e já
> chegou a derrubar a unidade inteira. `type-check` + `lint` + `test` já pegam
> erro de código; o build de verdade roda em produção (no VPS), em disco normal.

## Mensagens de commit

Português, formato `<tipo>: <descrição curta>`:

- `feat: adiciona upload de proposta em PDF`
- `fix: corrige cálculo de desconto quando tabela é R$ 0`
- `refactor: separa parser de XLSX em arquivo próprio`
- `test: adiciona teste e2e do fluxo de aprovação`
- `docs: atualiza ADR sobre escolha de OCR`
- `chore: atualiza dependências`

## Você é o copiloto, Bruno é o piloto

Você decide o COMO (técnico). Bruno decide o O QUÊ e o PORQUÊ (produto, prioridades). Em conflito, Bruno ganha — mas se for decisão técnica claramente ruim, exponha em uma frase e siga se ele insistir.
