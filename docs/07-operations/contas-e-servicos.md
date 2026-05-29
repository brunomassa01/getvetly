# Contas e Serviços — Checklist de Setup

Abrir nesta ordem. Cada serviço depende do anterior.

## Status das contas

| Serviço | Status | Custo | Link |
|---|---|---|---|
| GitHub | [x] **github.com/brunomassa01/getvetly** | Grátis | github.com |
| Supabase | [ ] Criar | Grátis | supabase.com |
| Anthropic (Claude API) | [ ] Criar | Pay-per-use | console.anthropic.com |
| Mistral AI (OCR) | [ ] Criar | Pay-per-use | console.mistral.ai |
| Stripe | [x] Já tem conta | 2.99% + R$0,39/transação | dashboard.stripe.com |
| Hostinger VPS KVM1 | [ ] Contratar | $4.49/mês | hostinger.com |
| Cloudflare | [ ] Criar | Grátis | cloudflare.com |
| Resend | [ ] Criar | Grátis (3K e-mails/mês) | resend.com |
| Sentry | [ ] Criar | Grátis | sentry.io |
| PostHog | [ ] Criar | Grátis | posthog.com |
| Inngest | [ ] Criar | Grátis | inngest.com |
| Domínio | [x] **getvetly.com comprado na Hostinger** | pago | hostinger.com |

---

## Passo 1 — GitHub

1. ✅ Repositório criado: `https://github.com/brunomassa01/getvetly.git`
2. Clonar / conectar a pasta local ao repositório:
   ```bash
   cd "G:\Meu Drive\PROJETOS-CLAUDE\Saas-propostas"
   git init
   git remote add origin https://github.com/brunomassa01/getvetly.git
   ```
4. Configurar GitHub Secrets para CI/CD (depois do Hostinger):
   - `SERVER_HOST` — IP do VPS
   - `SSH_PRIVATE_KEY` — chave SSH para deploy
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Todas as vars de `docs/03-backend/env-variables.md`

---

## Passo 2 — Supabase

1. Criar conta em supabase.com
2. Criar projeto: **Região São Paulo (sa-east-1)**
3. Nome do projeto: `saas-propostas`
4. Anotar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca expor no client)
   - `JWT secret` → `SUPABASE_JWT_SECRET`
5. Aplicar migrations (após scaffold do Next.js):
   ```bash
   # Instalar Supabase CLI
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```
6. Criar buckets de Storage:
   - `propostas-raw` (privado)
   - `whitelabel-assets` (privado)
   - `pdf-export` (privado)
7. Configurar Auth:
   - Site URL: `https://app.app.getvetly.com`
   - Templates de e-mail em PT-BR

---

## Passo 3 — Anthropic (Claude API)

1. Criar conta em console.anthropic.com
2. Criar API Key
3. Configurar limite de gasto: **$30/mês** (soft cap)
4. Anotar: `ANTHROPIC_API_KEY`
5. Modelo padrão: `claude-sonnet-4-6` (especificado no CLAUDE.md)

---

## Passo 4 — Mistral AI (OCR)

1. Criar conta em console.mistral.ai
2. Criar API Key
3. Configurar limite de gasto: **$10/mês**
4. Anotar: `MISTRAL_API_KEY`

---

## Passo 5 — Stripe (já tem conta)

1. Criar Products no Catalog:
   ```
   Starter Mensal:   R$ 297   → anotar price_id
   Starter Anual:    R$ 2.970 → anotar price_id
   Pro Mensal:       R$ 897   → anotar price_id
   Pro Anual:        R$ 8.970 → anotar price_id
   Business Mensal:  R$ 2.490 → anotar price_id
   Business Anual:   R$ 24.900 → anotar price_id
   ```
2. Habilitar PIX (Settings → Payment methods)
3. Configurar webhook (após deploy):
   - URL: `https://app.app.getvetly.com/api/webhooks/stripe`
   - Eventos: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
4. Anotar:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY` (prefixada `NEXT_PUBLIC_`)
   - `STRIPE_WEBHOOK_SECRET` (após criar o webhook)
5. Configurar Customer Portal
6. **Manter em modo teste até o MVP estar pronto**

---

## Passo 6 — Hostinger VPS KVM1

1. Acessar hostinger.com
2. Contratar **VPS KVM1** ($4.49/mês)
3. Sistema operacional: **Ubuntu 24.04 LTS**
4. Anotar o IP do servidor
5. Fazer setup conforme `docs/02-architecture/ADR-006-hosting-hostinger.md`
6. Adicionar IP no GitHub Secrets como `SERVER_HOST`

---

## Passo 7 — Cloudflare

1. Criar conta em cloudflare.com
2. Adicionar domínio (após registrar)
3. Apontar DNS: `app.app.getvetly.com` → IP do Hostinger (registro A)
4. SSL: Full (strict)
5. Ativar bot fight mode

---

## Passo 8 — Resend

1. Criar conta em resend.com
2. Adicionar domínio e configurar SPF/DKIM/DMARC
3. Criar API Key
4. Anotar: `RESEND_API_KEY`

---

## Passo 9 — Sentry, PostHog, Inngest

Abrir contas gratuitas, anotar as API keys. Configurar após scaffold do projeto.

---

## Domínio

- **getvetly.com**: ✅ comprado na Hostinger
- DNS já gerenciado pela Hostinger — apontar para o IP do VPS KVM1 após contratar
- Subdomínio de app: `app.getvetly.com` (registro A → IP do VPS)

---

## Resumo das variáveis de ambiente

Todas documentadas em `docs/03-backend/env-variables.md`.
Copiar `.env.example` para `.env.local` e preencher conforme for abrindo as contas.
