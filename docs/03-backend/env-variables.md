# Variáveis de Ambiente

Lista completa de variáveis necessárias. Copie em `.env.local` (dev) e configure no Vercel (prod).

## Como configurar

1. Copie `.env.example` para `.env.local`
2. Preencha cada chave seguindo a tabela abaixo
3. **NUNCA** commite `.env.local`
4. Em produção: configure no Vercel Dashboard → Settings → Environment Variables

## Convenção

- `NEXT_PUBLIC_*` — expostas no client (browser). Tudo público.
- Sem prefixo — só no server. Secret.

---

## Supabase

| Variável | Onde pegar | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon key | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role | `eyJh...` |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT secret | `xxxxx` |

⚠️ `SERVICE_ROLE_KEY` ignora RLS. Use APENAS em workers, webhooks e rotas server-side que precisem bypass justificado.

---

## Anthropic (Claude API)

| Variável | Onde pegar |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys |
| `ANTHROPIC_MODEL` | string, default `claude-sonnet-4-6` |

---

## Mistral OCR

| Variável | Onde pegar |
|---|---|
| `MISTRAL_API_KEY` | https://console.mistral.ai → API Keys |

---

## Stripe (BR)

| Variável | Onde pegar |
|---|---|
| `STRIPE_SECRET_KEY` | Dashboard → Developers → API Keys (modo test/live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | mesma página, chave pk_ |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Webhooks → endpoint criado |
| `STRIPE_PRICE_STARTER_MENSAL` | ID do preço no Stripe Catalog |
| `STRIPE_PRICE_STARTER_ANUAL` | idem |
| `STRIPE_PRICE_PRO_MENSAL` | idem |
| `STRIPE_PRICE_PRO_ANUAL` | idem |
| `STRIPE_PRICE_BUSINESS_MENSAL` | idem |
| `STRIPE_PRICE_BUSINESS_ANUAL` | idem |

---

## Resend (e-mail)

| Variável | Onde pegar |
|---|---|
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `RESEND_FROM_EMAIL` | string, ex: `nao-responda@seu-dominio.com.br` |
| `RESEND_REPLY_TO` | string, ex: `suporte@seu-dominio.com.br` |

⚠️ Domínio precisa ter SPF, DKIM e DMARC configurados (Resend mostra wizard).

---

## Inngest (worker assíncrono)

| Variável | Onde pegar |
|---|---|
| `INNGEST_EVENT_KEY` | https://app.inngest.com → Settings |
| `INNGEST_SIGNING_KEY` | mesma página |

---

## Posthog (analytics)

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | https://app.posthog.com → Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` ou self-host |

---

## Sentry (error tracking)

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | https://sentry.io → Project Settings → Client Keys |
| `SENTRY_AUTH_TOKEN` | https://sentry.io → User Settings → Auth Tokens |
| `SENTRY_ORG` | slug da org |
| `SENTRY_PROJECT` | slug do project |

---

## App

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_APP_URL` | dev: `http://localhost:3000` / prod: `https://app.seudominio.com.br` |
| `NEXT_PUBLIC_MARKETING_URL` | dev: `http://localhost:3001` / prod: `https://seudominio.com.br` |
| `APP_ENV` | `development` \| `staging` \| `production` |
| `JWT_SHARED_LINK_SECRET` | string aleatória 32+ chars (gere com `openssl rand -hex 32`) |
| `RATE_LIMIT_REDIS_URL` | Upstash Redis URL |
| `RATE_LIMIT_REDIS_TOKEN` | Upstash Redis token |

---

## `.env.example` (commite este)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

# Mistral
MISTRAL_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MENSAL=
STRIPE_PRICE_STARTER_ANUAL=
STRIPE_PRICE_PRO_MENSAL=
STRIPE_PRICE_PRO_ANUAL=
STRIPE_PRICE_BUSINESS_MENSAL=
STRIPE_PRICE_BUSINESS_ANUAL=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3001
APP_ENV=development
JWT_SHARED_LINK_SECRET=
RATE_LIMIT_REDIS_URL=
RATE_LIMIT_REDIS_TOKEN=
```

## Validação em runtime

Crie `lib/env.ts` que valida no boot:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  MISTRAL_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  // ... todas
});

export const env = envSchema.parse(process.env);
```

Se faltar variável, app não inicia. Falha cedo, falha alto.
