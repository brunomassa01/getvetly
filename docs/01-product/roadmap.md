# Roadmap

6 meses de desenvolvimento divididos em fases. Cada fase tem critério claro de saída.

## Fase 0 — Setup (semana 0, antes de codar)

**Critério de saída**: ambiente pronto, contas criadas, primeiro deploy "Hello World" no ar.

- [ ] Criar contas: GitHub, Vercel, Supabase, Stripe (test), Anthropic, Mistral, Resend, Inngest, Posthog, Sentry, Cloudflare
- [ ] Comprar domínio (.com.br e .com)
- [ ] Configurar repositório GitHub com proteção de branch `main`
- [ ] Setup local seguindo `scripts/setup.md`
- [ ] Deploy "Hello World" do Next.js no Vercel
- [ ] Subir migrations iniciais no Supabase
- [ ] Configurar env vars em dev e prod
- [ ] Testar pipeline de CI/CD (push → preview deploy)

---

## Fase 1 — Auth + Schema (semanas 1-2)

**Critério de saída**: usuário consegue criar conta, fazer login, criar workspace, convidar membro. Dados isolados por workspace via RLS testado.

User stories: **US-001, US-002, US-003, US-004, US-005**

- Signup com e-mail/senha + magic link
- Login + recuperação de senha
- Onboarding em 4 passos
- Criar workspace automaticamente no signup
- Convidar membros
- RLS testado em todas as tabelas com 2 workspaces diferentes
- Testes e2e do fluxo de auth

**Risco da fase**: configuração de Supabase Auth + e-mails do Resend. Reservar 1 dia para troubleshooting.

---

## Fase 2 — Upload + Pipeline IA (semanas 3-5)

**Critério de saída**: usuário sobe proposta real, análise sai em < 3 minutos com 80%+ de qualidade aceitável (validado com 5 propostas reais do Bruno).

User stories: **US-010, US-011, US-012, US-013, US-014, US-015**

- Upload de arquivos com drag-and-drop
- Form rápido de metadata
- Pipeline IA completo (Mistral OCR + Claude API + Zod)
- Worker Inngest configurado
- Página de detalhe da análise renderizando bonito
- Edição manual da análise
- Exportar PDF

**Risco da fase**: qualidade da extração de texto e prompt da IA. Reservar 3 dias pra iterar prompt com propostas reais.

**Marco de validação**: ao final, Bruno usa a ferramenta pra analisar 5 propostas reais que tem em mãos. Se a qualidade for boa, segue. Se não, ajusta antes de seguir.

---

## Fase 3 — Billing + Compartilhamento (semanas 6-7)

**Critério de saída**: usuário paga via Stripe e consegue compartilhar link com diretor que aprova. Pronto pra cobrar.

User stories: **US-040, US-041, US-042, US-060, US-061, US-062**

- Página de planos
- Stripe Checkout funcionando (test mode primeiro, depois live)
- Webhooks sincronizando status
- Customer Portal para gestão de assinatura
- Geração de links compartilháveis
- Página pública de revisão
- Aprovação/recusa pelo revisor externo
- E-mail de notificação

**Risco da fase**: Stripe BR + PIX. Reservar 2 dias pra config certa de produto fiscal e nota fiscal.

---

## Fase 4 — Comparativo + Fornecedores (semanas 8-9)

**Critério de saída**: usuário consegue comparar 2-5 propostas e ver histórico do fornecedor.

User stories: **US-020, US-021, US-030, US-031**

- Seleção múltipla na listagem
- Geração de comparativo
- Cadastro de fornecedor (manual e via análise)
- Página de detalhe do fornecedor com timeline
- Gráfico de evolução de preço
- Detecção de reajuste anômalo

---

## Fase 5 — Whitelabel + Admin (semana 10)

**Critério de saída**: produto pronto pra primeiro cliente Enterprise (whitelabel).

User stories: **US-050, US-070, US-071, US-072**

- Config completa de whitelabel
- Dados da empresa
- Notificações por e-mail
- Audit log
- Painel admin interno

---

## Fase 6 — Beta privado (semanas 11-12)

**Critério de saída**: 5 clientes pagantes ativos, NPS > 40, lista de bugs críticos zerada.

- Convidar 5-10 conhecidos do Bruno pra usar de graça por 2 semanas
- Sessões de onboarding 1:1 (1h cada)
- Coletar feedback estruturado
- Corrigir bugs críticos
- Polir UX (microinterações, mensagens de erro)
- Pesquisa NPS
- Casos de sucesso documentados (com permissão)

---

## Pós-MVP (mês 4+)

### v1.1 — Refinamento e crescimento (mês 4)

- Otimização de custo de IA (caching agressivo)
- Templates de e-mail mais polidos
- Dashboard de uso pra admin do workspace
- Notificações via Slack/Teams (integrações)
- Tour guiado em primeiro uso
- A/B testing de páginas críticas (landing, pricing)

### v1.2 — Recursos pedidos pelos clientes (mês 5)

(Definidos pelo feedback do beta. Possíveis:)
- Templates de proposta (cliente sobe template, IA já sabe a estrutura)
- Comentários inline entre membros do workspace
- Aprovação multi-step (CFO → CEO)
- Export Excel da análise
- Filtros avançados na listagem

### v2.0 — E-assinatura e contrato (mês 6)

- Integração D4Sign ou Clicksign
- Geração automática de contrato a partir da análise aprovada
- Fluxo de assinatura digital
- Repositório de contratos vigentes

### v2.1 — Mobile app (mês 7-8)

- App nativo React Native (iOS + Android)
- Foco em revisor (diretor aprovando no celular)
- Notificações push

### v3.0 — Plataforma (mês 9-12)

- API pública para parceiros
- Marketplace de fornecedores qualificados
- Integrações com ERPs (TOTVS, SAP, Sankhya)
- Internacionalização (EN, ES)
- Multi-região (LatAm)

---

## Métricas por fase

| Fase | Métrica de saída |
|---|---|
| 0 | Deploy funcionando |
| 1 | 100% das rotas auth testadas |
| 2 | 5 propostas reais analisadas com qualidade |
| 3 | 1ª cobrança em modo live no Stripe |
| 4 | 1º comparativo gerado |
| 5 | 1ª whitelabel ativa |
| 6 | 5 clientes pagantes |

---

## Não está no roadmap (consciente)

Coisas que NÃO faremos no primeiro ano e por quê:

- ❌ **App mobile nativo** — web responsivo cobre 95% do uso
- ❌ **Marketplace de fornecedores** — outro produto, distração
- ❌ **IA própria** — Claude é melhor que treinarmos modelo próprio nesse volume
- ❌ **Internacionalização** — mercado BR sozinho dá pra primeiros 100 clientes
- ❌ **Integração com ERP** — caro de manter, esperar demanda real
- ❌ **AI agentes autônomos** — risco de aprovar coisa errada; humano no loop sempre
- ❌ **Marketplace de templates** — distrai do core
- ❌ **Versão self-hosted** — operação distribuída quando temos 1 pessoa
