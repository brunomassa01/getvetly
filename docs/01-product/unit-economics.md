# Unit Economics — Custo por Cliente e Margem

**Regra de negócio inegociável**: Todo preço de venda deve cobrir os custos e gerar **no mínimo 50% de lucro sobre o custo**.

```
Fórmula: Preço ≥ Custo × 1,5
Ou seja: Margem = (Preço - Custo) / Custo ≥ 50%
```

Esta regra se aplica a: tiers de assinatura, add-ons, negociações Enterprise, pilotos com desconto.

---

## Premissas de custo (mai/2026)

**Taxa de câmbio**: 1 USD = R$ 5,60

### Custos fixos mensais (toda a infraestrutura)

| Serviço | Custo |
|---|---|
| Hostinger VPS KVM1 | R$ 25/mês |
| Supabase Free (até ~50 clientes) | R$ 0 |
| Supabase Pro (acima de 50 clientes) | R$ 140/mês |
| Demais serviços (Resend, Sentry, PostHog, Inngest) | R$ 0 (free tiers) |

### Custo variável por análise de proposta

| Componente | Estimativa | Base de cálculo |
|---|---|---|
| Mistral OCR (~7 páginas por proposta) | R$ 0,04 | $0,001/página |
| Claude API — input (~3.000 tokens) | R$ 0,05 | $3/MTok |
| Claude API — output (~1.500 tokens) | R$ 0,13 | $15/MTok |
| **Total por análise** | **~R$ 0,25** | com margem de segurança |

### Custo variável por comparativo de propostas

- Envolve análise cruzada de múltiplas propostas + síntese
- Estimativa: **~R$ 0,50 por comparativo** (2× o custo de análise simples)

### Taxa Stripe por transação

- Fórmula: `Preço × 2,99% + R$ 0,39`
- Exemplo Starter R$ 297: R$ 9,27 por cobrança mensal

---

## Cálculo de margem por tier

> Cenário base: 20 clientes ativos (custo fixo R$ 25/mês ÷ 20 = R$ 1,25/cliente)

### Starter — R$ 297/mês

| Item | Valor |
|---|---|
| 5 análises × R$ 0,25 | R$ 1,25 |
| 2 comparativos × R$ 0,50 | R$ 1,00 |
| Custo fixo por cliente | R$ 1,25 |
| **Custo total por cliente** | **R$ 3,50** |
| Stripe fee | R$ 9,27 |
| **Custo total incluindo Stripe** | **R$ 12,77** |
| **Receita líquida** | **R$ 287,23** |
| **Margem sobre custo** | **~2.150%** ✅ |

### Pro — R$ 897/mês

| Item | Valor |
|---|---|
| 50 análises × R$ 0,25 | R$ 12,50 |
| 20 comparativos × R$ 0,50 | R$ 10,00 |
| Custo fixo por cliente | R$ 1,25 |
| **Custo total por cliente** | **R$ 23,75** |
| Stripe fee | R$ 27,27 |
| **Custo total incluindo Stripe** | **R$ 51,02** |
| **Receita líquida** | **R$ 845,98** |
| **Margem sobre custo** | **~1.658%** ✅ |

### Business — R$ 2.490/mês

| Item | Valor |
|---|---|
| 200 análises × R$ 0,25 | R$ 50,00 |
| 100 comparativos × R$ 0,50 | R$ 50,00 |
| Custo fixo por cliente | R$ 1,25 |
| **Custo total por cliente** | **R$ 101,25** |
| Stripe fee | R$ 75,00 |
| **Custo total incluindo Stripe** | **R$ 176,25** |
| **Receita líquida** | **R$ 2.313,75** |
| **Margem sobre custo** | **~1.313%** ✅ |

### Enterprise — floor R$ 7.900/mês

Estimativa de uso máximo realista (ilimitado na prática):

| Item | Valor |
|---|---|
| 1.000 análises × R$ 0,25 | R$ 250,00 |
| 500 comparativos × R$ 0,50 | R$ 250,00 |
| Custo fixo por cliente | R$ 1,25 |
| **Custo total por cliente** | **R$ 501,25** |
| Stripe fee | R$ 236,30 |
| **Custo total incluindo Stripe** | **R$ 737,55** |
| **Receita líquida** | **R$ 7.162,45** |
| **Margem sobre custo** | **~971%** ✅ |

---

## Add-ons — verificação da regra de 50%

| Add-on | Preço | Custo estimado | Margem | Status |
|---|---|---|---|---|
| +10 análises | R$ 99/mês | R$ 2,50 (API) + R$ 3,35 (Stripe) = R$ 5,85 | ~1.590% | ✅ |
| +5 GB storage | R$ 49/mês | ~R$ 0 (Supabase free inclui) + R$ 1,86 (Stripe) | muito alto | ✅ |
| Whitelabel domínio próprio | R$ 197/mês | ~R$ 0 operacional + R$ 6,28 (Stripe) | muito alto | ✅ |
| Importar histórico antigo | R$ 2.000 one-time | R$ 100 (API) + R$ 60 (Stripe) + ~4h trabalho | depende do valor/hora | ⚠️ revisar |

> **⚠️ Add-on "Importar histórico"**: A R$ 2.000 e custo de ~R$ 160 em API/Stripe, a margem pura é ~1.150%. Mas o tempo de trabalho manual não está precificado. Se levar 8h de trabalho do Bruno, o valor/hora implícito é R$ 230/h — razoável. Manter mas revisar se o processo puder ser automatizado.

---

## Clientes piloto (50% off vitalício)

Os 5 primeiros clientes recebem 50% off eterno (política definida em pricing-strategy.md).

| Tier | Preço normal | Preço piloto | Custo | Margem piloto |
|---|---|---|---|---|
| Starter | R$ 297 | R$ 148,50 | R$ 12,77 | ~1.063% ✅ |
| Pro | R$ 897 | R$ 448,50 | R$ 51,02 | ~779% ✅ |
| Business | R$ 2.490 | R$ 1.245 | R$ 176,25 | ~607% ✅ |

> **Conclusão**: Mesmo com 50% off, a regra de 50% de margem é atendida com folga ampla.

---

## Onde a regra de 50% pode ser violada — riscos reais

### 1. Abuso de API sem controle de quota

Se um cliente conseguir burlar os limites do tier e gerar 10× o número de análises esperado, os custos variáveis explodem enquanto a receita não muda. **Mitigação**: hard limits por tier na aplicação (não só no frontend — validar no server + RLS).

### 2. Escala para 50+ clientes sem upgrade para Supabase Pro

Acima de ~50 clientes ativos, o free tier do Supabase se esgota. Custo sobe R$ 140/mês. **Mitigação**: monitorar e migrar antes de atingir o limite.

### 3. Aumento de preço dos modelos de IA

Anthropic e Mistral podem mudar pricing. Um aumento de 3× nos custos de API ainda manteria a margem acima de 50% para todos os tiers, mas exigiria revisão dos add-ons. **Mitigação**: revisar unit economics a cada 6 meses (junto com a revisão de pricing).

### 4. Negociação Enterprise abaixo do floor

Conceder desconto abaixo de R$ 7.900/mês para Enterprise sem calcular os custos reais do uso esperado. **Mitigação**: antes de qualquer proposta Enterprise customizada, rodar a fórmula: `Proposta ≥ Custo estimado × 1,5`.

---

## Checklist para novos preços (toda vez que criar um preço novo)

- [ ] Calculei o custo variável total (API + comparativos + storage)?
- [ ] Adicionei a taxa Stripe (2,99% + R$ 0,39)?
- [ ] Adicionei o rateio do custo fixo?
- [ ] Apliquei a fórmula: `Preço ≥ Custo total × 1,5`?
- [ ] Documentei o cálculo neste arquivo ou em um ADR?

---

*Última atualização: 2026-05-29*
*Revisar a cada 6 meses ou sempre que mudar pricing de fornecedores de IA.*
