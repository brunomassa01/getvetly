# Memory — Saas-propostas

## Regras Inegociáveis
- Todo arquivo do projeto deve ser salvo em `G:\Meu Drive\PROJETOS-CLAUDE\Saas-propostas\`
- Atualizar este MEMORY.md após cada deploy (versão, data, o que foi deployado)
- Zero gravação fora desta pasta

## O Projeto
**Nome**: getvetly  
**Domínio**: getvetly.com (comprado na Hostinger)  
**Versão atual**: 0.1.0 — landing page no ar em https://app.getvetly.com  
**Dono**: Bruno Romualdo Marinho — brunobrm@gmail.com

**O que é**: SaaS B2B para gestores de compras/supply chain analisarem propostas comerciais de fornecedores com IA, gerar relatórios padronizados, compartilhar link com diretoria para aprovação e manter histórico de fornecedores.

**Mercado-alvo**: PMEs e mid-market no Brasil. Concorrentes caros (Coupa, GEP) são para grandes empresas.

**Diferencial**: IA + leitura crítica honesta + whitelabel + preço PME.

## Stack
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Banco | PostgreSQL 16 self-hosted no VPS (R$0) — ver ADR-007 |
| Auth | Auth.js (NextAuth v5), sessões no Postgres — ver ADR-007 |
| Storage | Disco do VPS (MVP) → Cloudflare R2 ao escalar |
| Pagamento | Stripe |
| IA análise | Claude API (claude-sonnet-4-6) |
| OCR/Parsing | Mistral OCR API |
| E-mail | Resend |
| Hosting | Hostinger VPS KVM1 (R$52,99/mês) — ver ADR-006 |
| Analytics | PostHog |
| Erros | Sentry |

## Regra de Negócio — Margem Mínima
**Todo preço de venda deve cobrir os custos e gerar no mínimo 50% de lucro sobre o custo.**
Fórmula: `Preço ≥ Custo × 1,5` — vale para tiers, add-ons, Enterprise e pilotos.
Cálculo completo em `docs/01-product/unit-economics.md`.

## Pricing
- Starter: R$ 297/mês | Pro: R$ 897 | Business: R$ 2.490 | Enterprise: R$ 7.900+
- Custo real por cliente Starter (com Stripe): ~R$ 12,77/mês → margem ~2.150% ✓
- Pilotos com 50% off ainda respeitam a regra (margem ~1.063%)

## Infraestrutura — Servidor (configurado 2026-05-29)
- **VPS Hostinger KVM1** — IP `2.25.147.198` (Boston 2, Ubuntu 24.04 LTS)
- **Domínio**: `app.getvetly.com` → A record para o IP, DNS gerenciado na Hostinger
- **SSL**: Let's Encrypt ativo (renovação automática, expira 2026-08-27)
- **Stack do servidor**: Node 20.20.2, pnpm, PM2, Nginx (proxy reverso :3000), Certbot
- **Firewall**: ufw ativo (libera só SSH + Nginx 80/443)
- **Usuário de deploy**: `deploy` (sudo, sem senha, só chave SSH)
- **Chave SSH de deploy**: `/home/deploy/.ssh/getvetly_deploy` (privada → vai no GitHub Secret `SSH_PRIVATE_KEY`)
- **Pasta do app**: `/var/www/getvetly` (owner: deploy)
- **Sem Docker** (decisão adiada — ver ADR-006)

## Infraestrutura — Banco de dados (configurado 2026-05-29)
- **PostgreSQL 16** self-hosted no VPS — ver ADR-007
- **Banco**: `getvetly` | 14 tabelas criadas, RLS ativo em todas
- **Roles**: `getvetly_app` (respeita RLS) e `getvetly_service` (BYPASSRLS); tabelas owned by `postgres`
- **Credenciais (DATABASE_URL)**: `/root/getvetly-secrets/db-credentials.env` no servidor (chmod 600)
- **Adaptador anti-Supabase**: `db/bootstrap-selfhosted.sql` recria schema `auth`, `auth.users`, `auth.uid()`. Migrations 0001/0002 rodaram sem alteração.
- **app.current_user_id**: o Next.js deve rodar `select set_config('app.current_user_id','<id>',true)` por request para o RLS funcionar
- **Backup**: cron diário 3h (`/usr/local/bin/getvetly-backup.sh`), retém 7 dias em `/var/backups/getvetly`
- **Auth (a construir no código)**: Auth.js v5, tabelas `auth.users`/`auth.sessions` já existem

## Infraestrutura — App / Deploy (configurado 2026-05-29)
- **Repositório**: `git@github.com:brunomassa01/getvetly.git` (privado)
- **Next.js 14.2** scaffold no ar; design system Vetly embutido (Tailwind + globals + componente Logo)
- **Deploy Key** (VPS→GitHub, leitura): `/home/deploy/.ssh/github_deploy` (pública adicionada nos Deploy Keys do repo)
- **App no servidor**: clonado em `/var/www/getvetly`, rodando via PM2 (processo `getvetly`, porta 3000), Nginx faz proxy + SSL
- **CI/CD**: ✅ ATIVO — push na `main` → GitHub Actions roda lint/type-check/build → SSH no VPS → git pull + build + pm2 restart (`.github/workflows/deploy.yml`)
  - GitHub Secrets configurados: `SERVER_HOST`, `SSH_PRIVATE_KEY`
  - PM2 persiste no boot (systemd `pm2-deploy`)
  - ⚠️ Aviso futuro: actions em Node 20 serão forçadas a Node 24 a partir de 16/jun/2026 (não-bloqueante; atualizar versões das actions depois)

## ⚠️ Ambiente de desenvolvimento — Google Drive
- O projeto vive em `G:\Meu Drive\...` (Google Drive), que **não suporta symlinks** → `.npmrc` com `node-linker=hoisted` é obrigatório para o pnpm funcionar.
- **`pnpm build` NÃO funciona de forma confiável localmente** (Google Drive rejeita escritas do cache `.next` com EINVAL; e a busca de fontes do `next/font/google` depende de rede). 
- **Validação local**: rodar só `pnpm lint` e `pnpm type-check` (não dependem de rede/escrita pesada).
- **O build de produção real roda no VPS** (Linux, FS normal, rede estável) via a esteira de deploy. Lá funciona perfeitamente.

## Estado atual
- Documentação completa em `docs/`
- ✅ Servidor de produção configurado e com HTTPS
- ✅ Banco: PostgreSQL self-hosted no VPS, schema + RLS + backup
- ✅ App Next.js 14 + design system Vetly no ar em https://app.getvetly.com
- ✅ Auto-deploy ativo (push na main → produção)
- ✅ App conectado ao banco com helper de RLS (`lib/db/client.ts`: `getSqlApp`, `getSqlService`, `withUser`); validado em /api/health/db
- ✅ **Autenticação completa** (Auth.js v5): cadastro/login e-mail+senha, **login Google OAuth ATIVO**, recuperação de senha, painel protegido, middleware. Cadastro cria usuário + workspace + admin.
- ✅ Google OAuth ativo: credenciais no `.env` do VPS; projeto "GetVetly" no Google Cloud (modo teste — publicar antes de abrir ao público geral). Verificar em https://app.getvetly.com/api/auth/providers
- **Pendente p/ ativar**: conta Resend (e-mail de recuperação — hoje cai no log do servidor via `pm2 logs getvetly`)
- ✅ **CRUD de fornecedores** (US-030): /fornecedores (lista + busca debounce + filtro categoria), /novo, /[id] (editar + arquivar). Isolado por workspace via `withUser`. Padrão de telas estabelecido.
- ✅ **Vitest configurado** + passo de testes no CI (lint → type-check → testes → build). 8 testes (schemas de fornecedor e proposta).
- ✅ **Propostas — criação + upload** (US-010/011): /propostas (lista), /nova (form + upload múltiplo), /[id] (detalhe). Arquivos no disco do VPS (`STORAGE_DIR/<workspace>/<proposta>/`).
- ✅ **Análise por IA** (US-012): botão "Analisar com IA" → extrai texto do PDF (unpdf, local) → Claude (`lib/ai/`) → relatório (resumo executivo, prós, pontos a questionar, valores, itens, métricas). `ANTHROPIC_API_KEY` no `.env` do VPS. Nginx com `proxy_read_timeout 300s`. análises gravadas via service (BYPASSRLS), prompt v1.0.0.
  - MVP só lê PDF com texto (unpdf). PDF escaneado/imagem + XLSX/DOCX = evolução (Mistral OCR + libs). Análise é SÍNCRONA (server action); migrar p/ Inngest async se ficar lenta.
- **Pendente futuro**: checkout Stripe (chaves já em mãos), conta Resend, publicar app Google, comparativo de propostas (US-021), histórico/detalhe fornecedor (US-031)

## ⚠️ Segurança — segredos
- `BRUNO/getvetly.txt` no disco contém as chaves do Bruno (Anthropic, Google, Stripe). Pasta `BRUNO/` está no `.gitignore` — NUNCA versionar.
- 2026-05-29: GitHub Push Protection bloqueou um commit que continha esse arquivo (segredos não vazaram). Lição: evitar `git add .` cego; conferir `git status` antes de commitar. Segredos vão sempre via `.env` no servidor, nunca no repo.

## Como trabalhar
1. Bruno escolhe uma user story de `docs/01-product/user-stories.md`
2. Usar skill `implementar-feature`
3. Sempre mostrar plano antes de codar
4. Sempre escrever testes
5. Commit em português: `feat:`, `fix:`, `refactor:`, etc.

## Histórico de Deploys
- **2026-05-29 — v0.1.0 — primeiro deploy** 🎉
  - Landing page de preview da Vetly no ar em https://app.getvetly.com
  - Stack: Next.js 14.2 + design system Vetly (logo oficial, lime #C8FF02, Manrope)
  - Servidor: VPS Hostinger KVM1, PostgreSQL self-hosted, Nginx + SSL, PM2
  - Deploy manual (clone + build + pm2 no VPS). Auto-deploy via GitHub Actions pendente de Secrets.
- **2026-05-29 — auto-deploy ATIVADO** ✅
  - Pipeline GitHub Actions validado de ponta a ponta (lint → type-check → build → SSH → pm2 restart) em ~1m7s
  - A partir de agora: push na `main` = deploy automático em produção
- **2026-05-29 — fundação banco no ar** ✅
  - App conectado ao PostgreSQL self-hosted; `/api/health/db` retorna `{"ok":true,"banco":"conectado","workspaces":0}`
  - `lib/db/client.ts`: conexão lazy (não quebra build no CI) + `withUser` aplicando RLS por transação
  - Lição: nunca criar conexão de banco no top-level do módulo (quebra `next build` sem env) — sempre lazy
- **2026-05-29 — autenticação no ar** ✅
  - Auth.js v5: cadastro/login e-mail+senha, recuperação de senha, OAuth Google (condicional), painel protegido
  - Testado em produção: cadastro de "Bruno Massa" → redirecionou para /painel; `/api/health/db` agora `workspaces: 1`
  - VPS: adicionado `AUTH_TRUST_HOST=true` ao .env; migration 0003 (auth.password_reset_tokens) aplicada + grants
  - Detalhe: provedor Google só ativa se `AUTH_GOOGLE_ID/SECRET` existirem (não quebra login enquanto Google não está configurado)
- **2026-05-29 — login Google OAuth ATIVO** ✅
  - Credenciais criadas no Google Cloud (projeto "GetVetly"), redirect `https://app.getvetly.com/api/auth/callback/google`
  - `/api/auth/providers` confirma google + credentials; login Google testado OK
  - Lição operacional: NUNCA usar `read` dentro de bloco colado no terminal — ele consome as próximas linhas do script como input. Para segredos no servidor, editar via `nano` direto no `.env`.
- **2026-05-29 — CRUD de fornecedores no ar** ✅
  - US-030: lista com busca/filtro, cadastro, edição, arquivar. Tudo isolado por workspace (RLS via `withUser`).
  - Vitest entrou no projeto + passo de testes no CI. Padrão de tela (data layer → schema Zod → server actions → form client → páginas) estabelecido para reusar nas próximas features.
- **2026-05-29 — propostas (criação + upload) no ar** ✅
  - US-010/011: criar proposta com vínculo a fornecedor, valores e upload múltiplo de arquivos (disco do VPS).
  - `next.config` bodySizeLimit 25mb. Status `draft` (análise IA é a próxima fatia).
  - Incidente contido: Push Protection do GitHub barrou `BRUNO/getvetly.txt` (segredos) — removido do git, mantido no disco, pasta `BRUNO/` ignorada.
- **2026-05-29 — análise por IA no ar** ✅ (coração do produto)
  - US-012: PDF → texto (unpdf) → Claude (claude-sonnet-4-6) → relatório estruturado validado por Zod.
  - Deps: `@anthropic-ai/sdk`, `unpdf`. Chave Claude no `.env` do VPS, limite US$30. Prompt cacheado.
  - Nginx `proxy_read_timeout/send_timeout 300s` para a análise síncrona não estourar.
  - 12 testes no total. Aguardando 1º teste real do Bruno com PDF de proposta.
