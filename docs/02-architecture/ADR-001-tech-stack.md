# ADR-001: Stack principal — Next.js 14 + Supabase + Vercel

**Status**: Aceito
**Data**: 2026-05-28
**Decisor**: Bruno Romualdo Marinho

## Contexto

Estamos construindo um SaaS B2B brasileiro de análise de propostas comerciais para times de compras (procurement). O produto precisa entregar valor rápido — upload de proposta, OCR, análise por IA e relatório bonito — e ser operado por uma equipe pequena (idealmente 1 dev fundador + Claude Code) nos primeiros 12 a 18 meses.

As restrições principais são: (1) baixíssimo custo fixo até atingirmos receita recorrente saudável; (2) capacidade de iterar rápido em UI, porque o relatório é o coração do produto; (3) stack que o Claude Code consiga gerar e refatorar com alta confiabilidade, porque a maior parte do código sairá de pair programming com agentes; (4) suporte nativo a autenticação, banco relacional, storage de arquivos e RLS sem precisar montar infra do zero; (5) compliance razoável com LGPD (dados em região previsível, possibilidade de exportar/excluir).

A premissa é que vamos crescer de 0 a algumas centenas de tenants antes de qualquer reescrita — não estamos otimizando para "100 mil empresas" no dia 1.

## Decisão

Adotamos **Next.js 14 (App Router) com TypeScript** no frontend e nas rotas de API/server actions, hospedado na **Vercel**, com **Supabase** (Postgres gerenciado + Auth + Storage + Row-Level Security) como backend de dados, autenticação e armazenamento de arquivos. Tailwind + shadcn/ui para UI. Esse trio cobre 90% do que precisamos sem servidor proprio nem DevOps dedicado.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Next.js 14 + Supabase + Vercel (escolhida)** | Stack mais popular do ecossistema TS; Claude Code domina; Auth + DB + Storage + RLS prontos; deploy em git push; custo inicial proximo de zero | Vendor lock-in moderado em Vercel; cold start em funcoes; preco escala rapido se houver trafego alto de imagens |
| **Remix + Fly.io + Postgres gerenciado** | Modelo de form actions elegante; Fly tem boa presenca no Brasil (GRU) | Comunidade menor que Next; sem equivalente nativo de Supabase Auth/Storage; mais pecas para montar |
| **Rails 7 + Render** | Produtividade lendaria; Active Record maduro; Hotwire entrega UI rapida | Claude Code e mais forte em TS que em Ruby; menos candidatos no mercado BR; ecossistema de IA (Claude/Mistral SDK) e segunda classe |
| **Django + Heroku/Render** | Admin pronto; ORM solido; otimo para CRUD pesado | Frontend separado (React/Next) acaba sendo necessario mesmo assim — dobra a complexidade; Python desktop-grade mas TS e mais natural pro nosso caso |
| **NestJS + React separados + AWS (ECS/RDS/S3/Cognito)** | Maxima flexibilidade; escala para qualquer tamanho | Custo operacional altissimo no inicio; precisa de DevOps; Cognito e frustrante; multiplica o tempo ate o primeiro cliente pagante |

## Consequencias

Positivas:
- Time-to-first-deploy medido em horas, nao semanas.
- Auth, RLS, Storage e Postgres ja integrados — uma unica conta Supabase resolve quatro problemas.
- Vercel + Next.js dao preview deploy por branch, o que acelera revisao de UI com nao-tecnicos.
- Stack documentadissima: Claude Code raramente erra padroes idiomaticos.
- Custo previsivel e baixo ate aproximadamente 1.000 usuarios ativos.

Negativas / trade-offs aceitos:
- **Vendor lock-in real** com Vercel e Supabase. Mitigacao: Supabase e Postgres puro (portavel) e Next.js roda em qualquer Node runtime — sairiamos com esforco, mas sairiamos.
- **Funcoes serverless tem cold start** e limites de tempo (300s na Vercel Pro). Analises longas de IA serao executadas em background com job queue (decisao propria, fora deste ADR).
- **Preco da Vercel escala mal** com trafego de imagens e bandwidth. Mitigacao: CDN da Supabase Storage para arquivos grandes; revisar ao chegar em aproximadamente US$500/mes.
- App Router ainda tem arestas (cache, streaming) — exige disciplina.

## Quando revisar

- Quando ultrapassarmos **5.000 tenants ativos** ou **US$1.500/mes** somando Vercel + Supabase — vale recalcular vs. infra propria.
- Se a Vercel mudar pricing de forma hostil (ja aconteceu no mercado).
- Se Supabase tiver incidente de disponibilidade maior que 4h em producao, ou se RLS provar-se insuficiente para algum caso de cliente enterprise.
- Se aparecer um cliente regulado (banco, seguradora) que exija data residency especifica fora das regioes Supabase atuais.
