# Deployment e Operação

Como o produto entra em produção e fica de pé.

## Stack de hosting

| Componente | Onde | Custo aproximado |
|---|---|---|
| App (Next.js) | Vercel | Free → $20/mês Pro |
| Banco + Storage + Auth | Supabase | Free → $25/mês Pro |
| Worker assíncrono | Inngest | Free → $20/mês Pro |
| E-mail transacional | Resend | Free 3k → $20 |
| Rate limit (Redis) | Upstash | Free → ~$10 |
| DNS + CDN | Cloudflare | Free |
| Error tracking | Sentry | Free → $26 |
| Analytics | Posthog | Free → $20 |
| Domínio (.com.br + .com) | Registro.br + Namecheap | R$ 50/ano |

**Custo total MVP (50 workspaces)**: R$ 0-300/mês. Sobe pra ~R$ 800-1.500/mês ao 200 workspaces.

## Setup inicial (uma vez)

### Vercel

1. Conectar GitHub repo
2. Configurar env vars (todas de `docs/03-backend/env-variables.md`)
3. Domínio: adicionar `app.dominio.com.br` (Cloudflare aponta CNAME)
4. Habilitar Preview Deploys para cada PR
5. Configurar Analytics
6. Configurar Spend limits ($50/mês inicialmente)

### Supabase

1. Criar projeto na região **São Paulo** (sa-east-1)
2. Aplicar migrations: `supabase db push`
3. Criar buckets de Storage:
   - `propostas-raw` (privado, RLS por workspace)
   - `whitelabel-assets` (privado, RLS por workspace)
   - `pdf-export` (privado, signed URL temporária)
4. Configurar Auth:
   - Site URL: `https://app.dominio.com.br`
   - Redirect URLs: `https://app.dominio.com.br/**`
   - Templates de e-mail em PT-BR (signup, magic link, reset)
   - Provedor SMTP custom (Resend, para domínio próprio nos e-mails)
5. Configurar backup diário (Supabase Pro inclui 7 dias)

### Stripe

1. Criar conta Brasil (CNPJ ativo)
2. Habilitar PIX
3. Criar Products no Catalog:
   - Starter Mensal R$ 297 + Starter Anual R$ 2.970
   - Pro Mensal R$ 897 + Pro Anual R$ 8.970
   - Business Mensal R$ 2.490 + Business Anual R$ 24.900
4. Pegar `price_id` de cada (vão pra env vars)
5. Configurar webhook endpoint: `https://app.dominio.com.br/api/webhooks/stripe`
   - Eventos: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
6. Configurar Customer Portal (Settings → Billing → Customer Portal)
7. Configurar Tax Behavior (incluir impostos no preço — recomendado no BR)

### Inngest

1. Conectar via env vars
2. Definir functions no código (auto-deploy junto com Vercel)
3. Monitorar dashboard

### Resend

1. Adicionar domínio e configurar SPF/DKIM/DMARC
2. Criar API Key
3. Templates: Welcome, Magic Link, Reset, Convite, Análise Pronta, Compartilhamento, Aprovação, Fatura

### Cloudflare

1. Adicionar domínio
2. Apontar DNS para Vercel (`cname.vercel-dns.com`)
3. Configurar SSL: Full (strict)
4. Ativar bot fight mode
5. Ativar Cloudflare Analytics (gratuito)

## Deploy de mudanças (CI/CD)

### Fluxo normal

```
1. Branch local: git checkout -b feat/nova-feature
2. Implementar + testar local
3. Commit + push
4. Abrir PR no GitHub
5. CI roda: lint, type-check, test, build (~3 min)
6. Vercel cria Preview Deploy com URL única
7. Revisar manualmente (você + Claude Code via skill revisar-pre-commit)
8. Merge na main
9. Vercel deploy automático em produção (~2 min)
10. Verificar produção: smoke test manual + Sentry sem erros novos
```

### Hotfix em produção

```
1. Criar branch hotfix/descricao a partir da main
2. Fix + teste local + teste no preview
3. PR + merge direto (sem espera de review longo se for crítico)
4. Verificar prod imediatamente após deploy
5. Postmortem se a causa foi nossa (não só fix)
```

### Rollback

Vercel: 1 clique no dashboard reverte pro deploy anterior. <60 segundos.

Supabase: migration de rollback (se houver) ou restaurar backup. Use com cuidado, pode perder dados.

## Monitoramento

### Métricas críticas (dashboard interno + alertas)

| Métrica | Alvo | Alerta se |
|---|---|---|
| Uptime (Vercel + Supabase) | 99.9% | < 99% em 24h |
| Erro rate (Sentry) | < 0.5% | > 2% em 5 min |
| Latência P95 (API) | < 1s | > 3s em 10 min |
| Latência P95 (pipeline IA) | < 3 min | > 5 min |
| Pagamentos falhando (Stripe) | < 5% | > 10% em 1h |
| E-mails bouncing (Resend) | < 2% | > 5% |
| Storage Supabase | < 80% | > 90% |
| DB connections (Supabase) | < 80% | > 90% |
| Custo Anthropic/dia | dentro do budget | + 20% do esperado |

### Onde olhar

- **Vercel Analytics** — performance frontend
- **Supabase Logs** — queries lentas, RLS errors
- **Sentry** — erros server e client
- **Posthog** — uso por feature, funil
- **Stripe Dashboard** — receita, churn, MRR
- **Inngest Dashboard** — jobs com falha
- **Cloudflare Analytics** — tráfego, threats

### Alertas

Configure alertas pra Slack ou e-mail em:

- Sentry: spike de erro
- Vercel: build falhou em main
- Stripe: pagamento falhou, customer churnou
- Supabase: query > 5s, DB > 80% capacity
- Inngest: job falhou após retries

## Backup e disaster recovery

### Backup

- **Banco (Supabase Pro)**: backup automático diário, retenção 7 dias. Para retenção maior, exportar manualmente pra S3 toda semana.
- **Storage (Supabase Storage)**: backup manual semanal. Script `scripts/backup-storage.sh` baixa tudo via API e sobe pra S3 externo.
- **Código**: GitHub (já é o backup).
- **Configurações**: env vars exportadas mensalmente, criptografadas com `gpg`, salvas em local seguro (1Password, Bitwarden).

### Disaster recovery (DR)

Cenário: Supabase fora do ar por > 4h.

Plano:
1. Verificar status: status.supabase.com
2. Comunicar status pública: status.dominio.com.br (use [statuspage.io](https://www.statuspage.io) ou [instatus](https://instatus.com))
3. Se > 24h: ativar plano B — restaurar último backup em Neon ou RDS, apontar app
4. Custo: ~4 horas de trabalho + reconfigurações de DNS

Cenário: vazamento de chaves (env var leak no GitHub)

Plano:
1. Revogar chaves IMEDIATAMENTE em todos os serviços
2. Gerar novas e atualizar Vercel + dev local
3. Investigar exposure (commits recentes, logs)
4. Comunicar usuários se houve risco real (LGPD)
5. Sentry: validar que não houve uso indevido (api calls anômalas)
6. Postmortem completo

## Status page público

Use [Instatus](https://instatus.com) (free) ou [Statuspage](https://www.statuspage.io). Componentes:

- App web
- API
- Pipeline IA
- E-mail
- Pagamentos
- Banco

Atualizar automaticamente via health checks ou manualmente em incidente.

## Custos: como controlar

Setup orçamento por serviço:

| Serviço | Soft cap | Hard cap | O que acontece |
|---|---|---|---|
| Vercel | $30 | $50 | E-mail de aviso, então pausa |
| Supabase | $30 | $100 | Aviso, depois bloqueio de novos workspaces |
| Anthropic | $200 | $500 | Aviso, depois suspender análises do tier Starter |
| Mistral | $50 | $150 | Mesmo |
| Stripe | n/a | n/a | Sem capping (você quer cobrar tudo) |

Reajustar conforme cresce.

## Manutenção

### Semanal
- Revisar Sentry (erros novos? padrão?)
- Revisar usage do Posthog (feature pouco usada vale repensar?)
- Conferir Stripe (MRR, churn)
- Atualizar dependências (`pnpm outdated`)

### Mensal
- Aplicar updates de segurança (CVEs nas dependências)
- Backup manual do Storage
- Auditoria de acesso (quem tem service role key?)
- Análise de custo (alguma dependência crescendo demais?)
- Revisar metas de SLA (atingimos?)

### Trimestral
- Auditoria LGPD (ver `docs/06-compliance/lgpd-checklist.md`)
- Revisão de roadmap (estamos no ritmo?)
- Pesquisa NPS aos clientes
- Atualizar ADRs se decisões mudaram
