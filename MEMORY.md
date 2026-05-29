# Memory — Saas-propostas

## Regras Inegociáveis
- Todo arquivo do projeto deve ser salvo em `G:\Meu Drive\PROJETOS-CLAUDE\Saas-propostas\`
- Atualizar este MEMORY.md após cada deploy (versão, data, o que foi deployado)
- Zero gravação fora desta pasta

## O Projeto
**Nome**: getvetly  
**Domínio**: getvetly.com (comprado na Hostinger)  
**Versão atual**: 0.1.0 preview (documentação + migrations, sem código ainda)  
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

## Estado atual
- Documentação completa em `docs/`
- Migrations SQL prontas em `db/migrations/`
- Skills do Claude Code em `.claude/skills/`
- Design tokens e logos em `design/`
- ✅ Servidor de produção configurado e com HTTPS
- ✅ Banco: PostgreSQL self-hosted no VPS, schema + RLS + backup configurados — ver ADR-007
- **Código ainda não iniciado** — próximo passo: scaffold do Next.js

## Como trabalhar
1. Bruno escolhe uma user story de `docs/01-product/user-stories.md`
2. Usar skill `implementar-feature`
3. Sempre mostrar plano antes de codar
4. Sempre escrever testes
5. Commit em português: `feat:`, `fix:`, `refactor:`, etc.

## Histórico de Deploys
_(nenhum deploy ainda — projeto em fase de setup)_
