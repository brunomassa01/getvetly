# System Overview

Visão geral da arquitetura. Comece aqui antes dos ADRs específicos.

## Diagrama em ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                                │
│  Comprador (auth)     Diretor (link público)     Admin           │
└─────────────────────────────────────────────────────────────────┘
            │                    │                      │
            ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Vercel · Edge + Node)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ App Pages   │  │ API Routes  │  │ Server Actions      │     │
│  │ (RSC)       │  │ (REST)      │  │ (mutations)         │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
            │                    │                      │
            ▼                    ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ SUPABASE         │  │ INNGEST          │  │ EXTERNAL APIs    │
│ (São Paulo)      │  │ (worker async)   │  │                  │
│                  │  │                  │  │ • Claude API     │
│ • PostgreSQL     │  │ Pipeline IA      │  │ • Mistral OCR    │
│ • Auth           │──┤ executa em       │──┤ • Stripe         │
│ • Storage        │  │ background       │  │ • Resend (email) │
│ • Realtime       │  │                  │  │ • Sentry         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Componentes

### Frontend (Next.js 14 App Router)
- **Server Components por padrão** — render no servidor, zero JS no client quando possível
- **Client Components** apenas para interatividade (forms, drag-and-drop, gráficos)
- **Server Actions** para mutations (mais simples que API routes para forms)
- **Edge runtime** para rotas públicas (landing, link compartilhado)
- **Node runtime** para rotas com banco (todas as autenticadas)

### Backend
- **Não temos servidor separado.** Tudo roda dentro do Next.js (Vercel Functions).
- **Banco**: Supabase (PostgreSQL gerenciado, região São Paulo).
- **Auth**: Supabase Auth (e-mail/senha + magic link).
- **Storage**: Supabase Storage (bucket `propostas-raw` para arquivos).
- **Realtime**: Supabase Realtime opcional (notificação quando análise fica pronta).

### Worker assíncrono
- **Inngest** — fila de jobs com retry, observabilidade, scheduler.
- Job principal: `proposta.processar` que executa o pipeline de IA.
- Outros jobs: `email.enviar`, `pdf.gerar`, `compartilhamento.notificar`.

### APIs externas
- **Claude API (Anthropic)** — análise IA das propostas
- **Mistral OCR** — extração de texto de PDF/imagem
- **Stripe** — pagamento e billing
- **Resend** — e-mail transacional
- **Sentry** — error tracking
- **Posthog** — product analytics

### Observabilidade
- **Logs**: Vercel Logs + Sentry
- **Métricas de produto**: Posthog
- **Métricas de infra**: Vercel Analytics
- **Saúde**: rota `/api/admin/saude` com check de cada dependência

## Fluxo de uma análise (do upload ao relatório pronto)

```
1. Usuário acessa /propostas/nova
2. Preenche metadata (fornecedor, categoria, escopo)
   → Server Action cria registro em propostas (status: 'draft')
3. Arrasta arquivos no drop zone
   → Client faz upload direto pro Supabase Storage (signed URL)
   → Para cada arquivo: insert em proposta_arquivos
4. Usuário clica "Analisar"
   → POST /api/propostas/[id]/processar
   → status: 'processing'
   → Dispara evento Inngest: proposta.processar
5. Worker (Inngest):
   5.1. Para cada arquivo: extrai texto (Mistral OCR ou lib local)
   5.2. Monta contexto unificado
   5.3. Chama Claude API com prompt versionado
   5.4. Valida resposta com Zod
   5.5. Salva em analises (versão 1)
   5.6. status: 'ready'
   5.7. Notifica usuário (Realtime + email opcional)
6. Usuário vê relatório em /propostas/[id]
7. (Opcional) Compartilha link
   → POST /api/compartilhamentos
   → Recebe URL /r/[token]
8. Revisor abre link → vê análise → aprova
   → POST /api/r/[token]/aprovar (service role)
   → salva em aprovacoes
   → notifica comprador
```

## Decisões transversais

### Multi-tenancy
Shared database + Row-Level Security. Todo registro tem `workspace_id`. Todo SELECT/INSERT/UPDATE é filtrado pelo workspace do usuário logado. Veja `ADR-002-multi-tenancy.md`.

### Cache
- **CDN (Vercel Edge)** para assets estáticos
- **React Server Component cache** automático em páginas com dados públicos
- **Upstash Redis** para rate limiting + cache de análises (24h por hash de input)
- **Postgres** sem cache especial (Supabase usa connection pooler PgBouncer)

### Segurança em camadas
1. **RLS no banco** — última linha de defesa
2. **Validação no server** — toda Server Action/API valida com Zod
3. **Auth na rota** — middleware checa sessão antes de tudo
4. **Rate limit** — Upstash por IP + user + workspace
5. **CSP no header** — Content-Security-Policy estrito

### Localização
- App, e-mails, mensagens de erro: **PT-BR**
- Datas: `pt-BR` locale, formato `dd/MM/yyyy`
- Moeda: BRL, formato `R$ 1.234,56`
- Fuso: `America/Sao_Paulo` (todos os timestamps em UTC no banco, conversão na UI)

## Ambientes

| Ambiente | Onde | Quando usar |
|---|---|---|
| **local** | sua máquina | desenvolvimento |
| **preview** | Vercel preview deploys | cada PR gera URL temporária |
| **staging** | `staging.app.dominio` | testes finais antes de prod |
| **production** | `app.dominio` | usuários reais |

Cada ambiente tem seu próprio projeto Supabase, próprias chaves Stripe (test vs live), próprio domínio.

## Limites e escalabilidade

| Componente | Limite inicial | Quando trocar |
|---|---|---|
| Vercel Hobby | 100GB bandwidth/mês | quando passar — vai pra Pro ($20) |
| Supabase Free | 500MB DB, 1GB storage | aos 100 workspaces ativos — vai pra Pro ($25) |
| Inngest Free | 50k execuções/mês | aos 500 análises/mês — vai pra Pro ($20) |
| Resend Free | 3k e-mails/mês | aos 50 workspaces ativos — vai pra Pro ($20) |

**Custo zero até ~30 workspaces piloto.** Depois cresce linearmente.

## Quando esta arquitetura quebra

Cenários em que esta stack começa a doer e precisaria de reescrita:
- **> 10.000 workspaces ativos** — Postgres único pode virar bottleneck → considerar sharding ou read replicas
- **> 100 análises/min** — Inngest free não cobre → migrar pra Kubernetes ou Lambda
- **Multi-região (BR + LatAm + EUA)** — Supabase é single-region → migrar pra Neon (multi-region) ou self-host

**Para o MVP e os primeiros 2 anos, esta stack é mais que suficiente.**
