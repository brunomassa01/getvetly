# Custos Reais — getvetly

Documento de controle financeiro com valores pagos e estimados. Atualizado a cada nova despesa.

> **Para investidores**: este documento mostra o custo real de operação do produto, a margem bruta por cliente e a trajetória de custos conforme o produto escala.

---

## Despesas realizadas (up-to-date)

| Data | Item | Tipo | Valor | Recorrência |
|---|---|---|---|---|
| 2026-05-29 | Domínio getvetly.com (Hostinger) | Infraestrutura | R$ 51,08 | Anual |
| 2026-05-29 | VPS KVM1 (Hostinger, Boston 2) | Infraestrutura | R$ 52,99 | Mensal |

**Total investido até hoje**: R$ 104,07  
**Custo fixo mensal atual**: R$ 52,99 + R$ 4,26 (domínio amortizado) = **R$ 57,25/mês**

---

## Estrutura de custos — MVP (0–50 clientes)

### Custos fixos mensais

| Serviço | Plano | Custo real/mês | Status |
|---|---|---|---|
| VPS KVM1 — Hostinger | Pago | R$ 52,99 | ✅ Ativo |
| Domínio getvetly.com | Anual R$51,08 ÷ 12 | R$ 4,26 | ✅ Ativo |
| Banco de dados (Supabase) | Free | R$ 0 | Pendente criar conta |
| Repositório (GitHub) | Free | R$ 0 | ✅ Ativo |
| DNS / CDN (Cloudflare) | Free | R$ 0 | Pendente |
| E-mail transacional (Resend) | Free 3K/mês | R$ 0 | Pendente |
| Error tracking (Sentry) | Free | R$ 0 | Pendente |
| Analytics (PostHog) | Free | R$ 0 | Pendente |
| Jobs assíncronos (Inngest) | Free | R$ 0 | Pendente |
| **TOTAL FIXO** | | **R$ 57,25/mês** | |

### Custos variáveis (por uso de IA)

| Serviço | Custo estimado por análise | Fonte |
|---|---|---|
| Mistral OCR (~7 páginas) | R$ 0,04 | $0,001/página |
| Claude API — input (~3.000 tokens) | R$ 0,05 | $3/MTok |
| Claude API — output (~1.500 tokens) | R$ 0,13 | $15/MTok |
| **Total por análise** | **R$ 0,22** | estimativa conservadora |

| Serviço | Custo estimado por mês (MVP) | Base |
|---|---|---|
| Claude API | R$ 56–84 | 500K–1M tokens/mês |
| Mistral OCR | R$ 11–28 | variável por volume |
| **Total variável estimado** | **R$ 67–112/mês** | |

### Custo variável por transação (Stripe)

- Taxa: 2,99% + R$ 0,39 por cobrança bem-sucedida
- Exemplos:
  - Starter R$297 → R$ 9,27 de taxa
  - Pro R$897 → R$ 27,27 de taxa
  - Business R$2.490 → R$ 74,97 de taxa

---

## Custo total de operação por fase

| Fase | Clientes | Custo fixo | Custo variável est. | **Total/mês** |
|---|---|---|---|---|
| **Pré-receita** (agora) | 0 | R$ 57 | R$ 0 | **R$ 57/mês** |
| **MVP / Pilotos** | 1–5 | R$ 57 | R$ 30–60 | **R$ 87–117/mês** |
| **Tração inicial** | 6–20 | R$ 57 | R$ 80–180 | **R$ 137–237/mês** |
| **Crescimento** | 21–50 | R$ 57 | R$ 150–350 | **R$ 207–407/mês** |
| **Escala** | 51–100 | R$ 57 + R$140 Supabase Pro | R$ 300–600 | **R$ 497–797/mês** |

---

## Margem bruta por tier (com custos reais)

> Custo por cliente = custo fixo rateado + custo variável de uso + taxa Stripe

### Starter — R$ 297/mês

| Item | Valor |
|---|---|
| Receita bruta | R$ 297,00 |
| Taxa Stripe | (R$ 9,27) |
| Custo variável (5 análises + 2 comparativos) | (R$ 2,10) |
| Custo fixo rateado (20 clientes) | (R$ 2,86) |
| **Receita líquida** | **R$ 282,77** |
| **Margem bruta** | **95,2%** ✅ |

### Pro — R$ 897/mês

| Item | Valor |
|---|---|
| Receita bruta | R$ 897,00 |
| Taxa Stripe | (R$ 27,27) |
| Custo variável (50 análises + 20 comparativos) | (R$ 21,00) |
| Custo fixo rateado | (R$ 2,86) |
| **Receita líquida** | **R$ 845,87** |
| **Margem bruta** | **94,3%** ✅ |

### Business — R$ 2.490/mês

| Item | Valor |
|---|---|
| Receita bruta | R$ 2.490,00 |
| Taxa Stripe | (R$ 74,97) |
| Custo variável (200 análises + 100 comparativos) | (R$ 88,00) |
| Custo fixo rateado | (R$ 2,86) |
| **Receita líquida** | **R$ 2.324,17** |
| **Margem bruta** | **93,3%** ✅ |

---

## Ponto de equilíbrio (break-even)

| Cenário | MRR necessário | Equivale a |
|---|---|---|
| Cobrir só infraestrutura (R$57/mês) | R$ 57 | 1 cliente Starter paga o servidor |
| Break-even incluindo variável (R$120/mês) | R$ 120 | 1 cliente Starter cobre tudo |
| Lucro real (após impostos ~15%) | R$ 140/mês | 1 cliente Pro = lucro real |

**Conclusão**: **1 cliente Pro pagante já cobre toda a infraestrutura com folga.**

---

## Projeção de receita vs custo (cenário conservador)

| Mês | Clientes | MRR est. | Custo total | **Lucro bruto** |
|---|---|---|---|---|
| M1 | 0 | R$ 0 | R$ 57 | (R$ 57) |
| M2 | 2 pilotos (50% off) | R$ 448 | R$ 100 | R$ 348 |
| M3 | 5 pagantes | R$ 2.235 | R$ 180 | R$ 2.055 |
| M6 | 15 pagantes | R$ 6.705 | R$ 280 | R$ 6.425 |
| M12 | 40 pagantes | R$ 17.880 | R$ 500 | R$ 17.380 |

> ARPU estimado: R$ 447/mês (mix de tiers conforme pricing-strategy.md)

---

## Resumo para investidores

| Métrica | Valor |
|---|---|
| **Custo de infra pré-receita** | R$ 57/mês |
| **Custo total MVP (5 clientes)** | ~R$ 117/mês |
| **Margem bruta média** | ~94% |
| **Break-even** | 1 cliente Pro |
| **CAC estimado** | R$ 0 (validação por rede do fundador) |
| **LTV estimado (Starter, 18 meses)** | R$ 5.346 |
| **LTV/CAC** | ∞ (sem custo de aquisição inicial) |
| **Total investido até hoje** | R$ 104,07 |

---

*Última atualização: 2026-05-29*
*Próxima revisão: quando atingir 10 clientes pagantes*
