# Setup do Ambiente Local

Passo a passo pra você (não-programador) preparar tudo na sua máquina antes de codar.

## Pré-requisitos

Instale antes de começar:

1. **Node.js 20+ (LTS)** — https://nodejs.org (baixe a versão LTS)
2. **pnpm** — abra terminal e rode: `npm install -g pnpm`
3. **Git** — https://git-scm.com/downloads
4. **Supabase CLI** — `brew install supabase/tap/supabase` (Mac) ou veja docs.supabase.com
5. **Stripe CLI** — https://stripe.com/docs/stripe-cli
6. **Editor**: VS Code com extensões: Prettier, ESLint, Tailwind CSS IntelliSense, Supabase
7. **Claude Code** — https://claude.com/code

## Passo 1 — Criar contas

Reserve 30 minutos. Faça uma de cada vez.

| Serviço | URL | O que pegar |
|---|---|---|
| GitHub | github.com | Conta + repositório novo (privado) chamado `procurement-saas` (ou nome que escolher) |
| Vercel | vercel.com | Conta conectada ao GitHub |
| Supabase | supabase.com | Conta + projeto novo na região **São Paulo** |
| Anthropic | console.anthropic.com | Conta + API Key (modo Build) |
| Mistral | console.mistral.ai | Conta + API Key |
| Stripe | dashboard.stripe.com | Conta Brasil; ativar **modo Test** primeiro |
| Resend | resend.com | Conta + API Key |
| Inngest | app.inngest.com | Conta |
| Upstash | upstash.com | Conta + 1 Redis grátis |
| Posthog | posthog.com | Conta |
| Sentry | sentry.io | Conta + projeto Next.js |
| Cloudflare | cloudflare.com | Conta + adicionar domínio |
| Registro.br | registro.br | Comprar domínio .com.br (R$ 40/ano) |
| Namecheap | namecheap.com | Comprar domínio .com (~R$ 50/ano) |

⚠️ **Atenção**: anote todas as URLs e API Keys em um gerenciador de senhas (1Password, Bitwarden). Nunca em arquivo .txt no Desktop.

## Passo 2 — Clonar o projeto

Você ainda não tem código nenhum — vamos partir do zero.

```bash
# Cria pasta
cd ~/Documents
mkdir procurement-saas
cd procurement-saas

# Inicializa git
git init
git remote add origin https://github.com/SEU-USUARIO/procurement-saas.git

# Inicializa Next.js
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint
# Quando perguntar: Use Turbopack? → Yes

# Adiciona dependências essenciais
pnpm add @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk stripe zod react-hook-form @hookform/resolvers next-themes lucide-react date-fns

# Dev dependencies
pnpm add -D @types/node typescript prettier eslint eslint-config-next prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @playwright/test
```

## Passo 3 — Copiar arquivos deste pacote

Copie os arquivos deste pacote pro projeto:

```bash
# Estando dentro de procurement-saas/
cp /caminho/para/saas-procurement/CLAUDE.md .
cp -r /caminho/para/saas-procurement/.claude ./.claude
cp -r /caminho/para/saas-procurement/docs ./docs
cp -r /caminho/para/saas-procurement/db ./db
cp -r /caminho/para/saas-procurement/design ./design
```

Edite `README.md` do projeto pra apontar pra esta documentação.

## Passo 4 — Configurar shadcn/ui

```bash
pnpm dlx shadcn@latest init
# Style: Default
# Base color: Neutral
# CSS variables: Yes

pnpm dlx shadcn@latest add button input label card dialog dropdown-menu sheet tabs toast tooltip avatar badge select switch checkbox form
```

## Passo 5 — Configurar Supabase

```bash
# Login
supabase login

# Inicializar no projeto
supabase init

# Linkar com seu projeto Supabase (pega project ref no dashboard)
supabase link --project-ref SEU-PROJECT-REF

# Aplicar as migrations
supabase db push
```

## Passo 6 — Criar `.env.local`

Copie `.env.example` (você vai criar baseado em `docs/03-backend/env-variables.md`) para `.env.local` e preencha com as keys que pegou no passo 1.

```bash
cp .env.example .env.local
# Abra .env.local no VS Code e preencha
```

## Passo 7 — Testar setup

```bash
# Roda em dev
pnpm dev

# Abre http://localhost:3000
# Deve ver "Hello World" do Next.js
```

Se chegou aqui: setup local funcionando. Próximo é começar a codar.

## Passo 8 — Conectar Claude Code

```bash
# Na pasta do projeto
claude code .
```

No primeiro prompt, diga ao Claude Code:

> "Leia CLAUDE.md, depois docs/00-START-HERE.md. Confirma que entendeu o produto e me mostra o resumo em 5 linhas. Depois disso, vamos implementar a primeira user story."

O Claude Code vai automaticamente carregar as skills em `.claude/skills/` e seguir as convenções do CLAUDE.md.

## Passo 9 — Primeiro deploy de teste

Antes mesmo de ter código real, deploy um "Hello World" pra garantir que a esteira funciona:

```bash
git add .
git commit -m "chore: setup inicial do projeto"
git push -u origin main
```

No Vercel:
1. Import Project → GitHub → seu repo
2. Configure env vars (cole todas do `.env.local`)
3. Deploy

Espere ~2 min. Acesse a URL que o Vercel gerar. Se aparecer o app: tudo funcionando.

## Passo 10 — Configurar domínio

No Vercel:
1. Settings → Domains → Add `app.seudominio.com.br`
2. Vercel mostra CNAME para configurar

No Cloudflare:
1. Adicionar registro CNAME apontando para `cname.vercel-dns.com`
2. Aguardar ~5 min

Pronto. `app.seudominio.com.br` apontando pro seu app.

## Comandos do dia a dia

```bash
pnpm dev              # rodar em desenvolvimento
pnpm build            # build de produção
pnpm lint             # checar erros de estilo
pnpm type-check       # checar tipos TypeScript
pnpm test             # rodar testes unit/integration
pnpm test:e2e         # rodar testes end-to-end
pnpm format           # formatar código automaticamente

# Banco de dados
supabase db push      # aplicar migrations
supabase db reset     # zerar banco local (CUIDADO em prod!)
supabase gen types typescript --local > types/supabase.ts
```

## Quando der erro

1. **Erro de instalação** → apague `node_modules` e `pnpm-lock.yaml`, rode `pnpm install` de novo
2. **Erro de env var** → confira `.env.local` (não pode ter aspas extras, espaço, etc.)
3. **Erro de banco** → confira se `supabase status` mostra tudo rodando
4. **Erro de build** → leia mensagem de erro, copia, mostra pro Claude Code
5. **Erro misterioso** → pergunte ao Claude Code, ele lê stack trace muito bem

## Checklist final do setup

- [ ] Todas as 14 contas criadas e logadas
- [ ] Projeto inicializado com Next.js + Tailwind + shadcn/ui
- [ ] Pasta `.claude/` com 5 skills no lugar
- [ ] `docs/` completo no projeto
- [ ] `db/` com 2 migrations no lugar
- [ ] `.env.local` preenchido (não commitado)
- [ ] `supabase db push` aplicou as 2 migrations
- [ ] `pnpm dev` roda sem erro em `localhost:3000`
- [ ] Primeiro commit pushed pra `main` no GitHub
- [ ] Deploy automático no Vercel funcionou
- [ ] Domínio configurado e apontando
- [ ] Claude Code aberto na pasta e leu CLAUDE.md

Quando tudo isso estiver ✅, está pronto pra implementar a primeira user story.

## Primeira user story sugerida

`US-001: Signup com e-mail e senha`. É a fundação de tudo. Use a skill `implementar-feature`:

> "Vamos implementar a US-001 do user-stories.md"

Boa sorte!
