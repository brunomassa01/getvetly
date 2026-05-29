# Roteiro de leitura

Esta documentação foi escrita para ser lida em ordem. Cada bloco prepara o próximo. Reserve 60-90 minutos para a primeira leitura completa.

## Bloco 1 — Produto (30 min)

O que estamos construindo, para quem, com qual modelo de negócio.

1. **`01-product/PRD.md`** — Product Requirements Document. Visão, problema, solução, escopo MVP.
2. **`01-product/personas-and-jtbd.md`** — quem usa o produto e que "job" eles contratam o produto para fazer.
3. **`01-product/user-stories.md`** — 30+ user stories que formam o MVP. Esta é a fonte da verdade do que vai ser construído.
4. **`01-product/pricing-strategy.md`** — modelo de cobrança, tiers, métricas que importam.
5. **`01-product/roadmap.md`** — 6 meses de desenvolvimento divididos em fases.

## Bloco 2 — Arquitetura (20 min)

Como o sistema é estruturado e por quê.

1. **`02-architecture/system-overview.md`** — visão geral, diagrama, fluxos principais.
2. **`02-architecture/ADR-001-tech-stack.md`** — por que Next.js + Supabase + Vercel.
3. **`02-architecture/ADR-002-multi-tenancy.md`** — como isolamos dados de clientes diferentes.
4. **`02-architecture/ADR-003-ai-pipeline.md`** — como a IA analisa uma proposta.
5. **`02-architecture/ADR-004-document-parsing.md`** — como extraímos texto de PDF/XLSX/DOCX.
6. **`02-architecture/ADR-005-payments.md`** — Stripe + tiers + webhooks.

## Bloco 3 — Backend (20 min)

Onde os dados moram, como eles fluem, quais regras protegem.

1. **`03-backend/database-schema.sql`** — schema executável completo (rode no Supabase para criar tudo).
2. **`03-backend/rls-policies.sql`** — Row-Level Security, regras de acesso.
3. **`03-backend/api-reference.md`** — endpoints, payloads, respostas.
4. **`03-backend/ai-pipeline.md`** — como o Claude API é chamado e o que ele retorna.
5. **`03-backend/env-variables.md`** — lista completa de variáveis de ambiente.

## Bloco 4 — Frontend (15 min)

Como a interface é organizada.

1. **`04-frontend/design-system.md`** — tokens, cores, tipografia, componentes.
2. **`04-frontend/sitemap.md`** — todas as rotas do app.
3. **`04-frontend/key-flows.md`** — os 5 fluxos críticos do usuário, com wireframe textual.

## Bloco 5 — Testes, Compliance, Operação (15 min)

O que garante que não quebra em produção.

1. **`05-testing/strategy.md`** — pirâmide, cobertura, ferramentas.
2. **`06-compliance/lgpd-checklist.md`** — o que precisa estar pronto para vender no Brasil sem dor.
3. **`07-operations/deployment.md`** — como entra em produção.

## Bloco 6 — Setup do ambiente

Faça quando estiver pronto para começar a codar.

1. **`scripts/setup.md`** — passo a passo do setup local.
2. Crie as contas necessárias (GitHub, Vercel, Supabase, Stripe, Anthropic).
3. Clone o repositório (você ainda precisa criar — instruções em `scripts/setup.md`).
4. Abra no Claude Code e diga: *"Leia CLAUDE.md, depois implementa a primeira user story de docs/01-product/user-stories.md."*

## Como esta documentação deve evoluir

- **Decisões mudam.** Quando uma decisão for revista, escreva um novo ADR superando o anterior. Mantenha o anterior para histórico.
- **PRD não é fixo.** Conforme você falar com clientes, ajuste. Mas registre a mudança e o porquê.
- **User stories crescem.** Adicione novas conforme aparecerem. Marque concluídas com checkbox.
- **Skills do Claude Code podem ser editadas.** Se você notar que o Claude está esquecendo algo, adicione ao skill ou ao CLAUDE.md.

## Glossário rápido

- **MVP**: Minimum Viable Product. Versão mínima que entrega valor para clientes pagantes.
- **PRD**: Product Requirements Document. O que estamos construindo.
- **ADR**: Architecture Decision Record. Por que decidimos algo de um jeito e não de outro.
- **RLS**: Row-Level Security. Regra do banco que impede um cliente ver dados de outro.
- **Multi-tenancy**: arquitetura onde vários clientes usam a mesma instância do software com isolamento.
- **Workspace**: o "espaço" de um cliente. Cada empresa que assina é 1 workspace.
- **Whitelabel**: cliente personaliza com a própria marca. Sua marca não aparece nos relatórios.
- **SLA**: Service-Level Agreement. Compromisso de disponibilidade/resposta.
- **OCR**: Optical Character Recognition. Tecnologia que extrai texto de imagem/PDF escaneado.
- **JTBD**: Jobs-To-Be-Done. Framework para entender que "trabalho" o cliente contrata o produto para fazer.
