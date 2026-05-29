# Estratégia de Pricing

Modelo de cobrança do produto. Versionado — quando mudar, criar v2 e mover este para arquivo.

## Tiers

| Tier | Mensal | Anual (com desconto) | Para quem |
|---|---|---|---|
| **Starter** | R$ 297 | R$ 2.970 (R$ 247/mês) | Comprador individual de PME |
| **Pro** | R$ 897 | R$ 8.970 (R$ 747/mês) | Time pequeno de compras (2-5 pessoas) |
| **Business** | R$ 2.490 | R$ 24.900 (R$ 2.075/mês) | Empresa média (5-20 compradores) |
| **Enterprise** | Sob consulta (R$ 7.900+) | — | Holdings, consultorias whitelabel |

Anual = 2 meses grátis (16% de desconto efetivo).

## O que está incluso em cada tier

| Recurso | Starter | Pro | Business | Enterprise |
|---|---|---|---|---|
| Usuários | 1 | até 5 | até 20 | ilimitado |
| Análises de proposta/mês | 5 | 50 | 200 | ilimitado |
| Comparativos/mês | 2 | 20 | 100 | ilimitado |
| Storage de arquivos | 500 MB | 5 GB | 25 GB | sob acordo |
| Fornecedores cadastrados | 25 | ilimitado | ilimitado | ilimitado |
| Links compartilháveis | 10 ativos | ilimitado | ilimitado | ilimitado |
| Whitelabel (logo + cor) | ❌ | ✅ | ✅ | ✅ |
| Whitelabel completo (domínio) | ❌ | ❌ | ✅ | ✅ |
| Histórico de fornecedor | ✅ | ✅ | ✅ | ✅ |
| Exportar PDF | ✅ | ✅ | ✅ | ✅ |
| Edição manual da análise | ❌ | ✅ | ✅ | ✅ |
| Audit log | 30 dias | 180 dias | ilimitado | ilimitado |
| Integrações (Slack, Teams) | ❌ | ❌ | ✅ | ✅ |
| API pública | ❌ | ❌ | ❌ | ✅ |
| SLA de uptime | 99% | 99.5% | 99.9% | 99.95% + suporte dedicado |
| Suporte | E-mail (48h) | E-mail + chat (24h) | Prioritário (8h) | Dedicado + WhatsApp |
| Onboarding | Self-service | Self-service | 1h com CS | Implantação completa |

## Trial

- **7 dias grátis** ao se cadastrar
- Sem cartão de crédito
- Acesso completo ao Pro durante o trial
- Após trial: cai automaticamente pra Starter ou solicita upgrade

## Pacotes adicionais (add-ons)

Para clientes que querem mais sem subir de tier completo:

| Add-on | Valor | Descrição |
|---|---|---|
| +10 análises | R$ 99/mês | adiciona ao limite mensal |
| +5 GB storage | R$ 49/mês | adiciona ao limite |
| Whitelabel domínio próprio | R$ 197/mês | seu-cliente.com.br |
| Importar histórico antigo | R$ 2.000 one-time | nós importamos suas cotações de Excel/Drive |

## Cobrança

- **Método**: cartão de crédito (Visa, Master, Amex, Elo, Hipercard) ou PIX
- **Ciclo**: mensal renova no dia da assinatura; anual renova 1 ano depois
- **Falha de pagamento**: 3 tentativas em 7 dias, depois suspende
- **Cancelamento**: a qualquer momento, sem multa; acesso mantido até fim do ciclo já pago
- **Reembolso**: até 7 dias após primeira cobrança (sem perguntas)

## Métricas de pricing pra acompanhar

- **MRR (Monthly Recurring Revenue)** — total receita recorrente
- **ARR (Annual)** — projeção anual
- **ARPU (Average Revenue Per User)** — meta inicial: R$ 600
- **Conversão trial → pago** — meta: 15-20%
- **Distribuição por tier** — meta inicial: 60% Pro, 25% Starter, 10% Business, 5% Enterprise
- **Churn mensal** — meta < 5% no primeiro ano, < 3% no segundo
- **Net Revenue Retention** — meta > 100% no segundo ano (cliente sobe de tier)
- **Time-to-value** — quanto tempo até primeira análise: meta < 15 min do signup

## Estratégia de upsell

Triggers automáticos para sugerir upgrade:

1. **Usou 80% do limite de análises do mês** → banner "Pro tem 10× mais"
2. **Tentou convidar 2º membro no Starter** → modal "Pro permite até 5"
3. **Tentou ativar whitelabel no Starter** → modal "Pro inclui whitelabel"
4. **Compartilhou link 10×** → "Cliente perceptivo. Pro tem links ilimitados"

Sem ser chato — máximo 1 sugestão por sessão.

## Estratégia de downsell

Quando cliente cancela:

1. Pergunta motivo (4 opções pré-definidas + texto livre)
2. Oferece pausar (até 3 meses sem cobrança) em vez de cancelar
3. Se cancelar mesmo, mantém dados por 90 dias (pode voltar)
4. Pesquisa NPS 30 dias depois

## Como vamos comparar com concorrentes

**Discurso de posicionamento**:

> "Linkana custa R$ 5.000/mês e foca em qualificar fornecedor. A gente custa R$ 297-2.490 e foca em analisar a proposta dele. Coupa custa US$ 50k/ano e atende Petrobras. A gente atende a sua empresa que tem 50-500 funcionários."

**Página de comparação** (em `/precos/vs/[concorrente]`):
- `/precos/vs/coupa`
- `/precos/vs/linkana`
- `/precos/vs/excel` (sim, planilha)

Cada uma destaca 3-4 pontos onde ganhamos, é honesta nos pontos onde perdemos.

## Política de preços para clientes piloto

Os 5 primeiros clientes pagantes (conhecidos do Bruno, validação) recebem:

- 50% off vitalício no tier escolhido (gratidão por confiar cedo)
- Onboarding personalizado de 2h com você (Bruno)
- Acesso direto via WhatsApp pra reportar bug/sugestão
- "Cliente fundador" visível no perfil dentro do produto

Em troca: depoimento, case study e referência pra próximos clientes.

## Política Enterprise (vendas)

Negociação 1:1 quando:
- Cliente quer > 200 análises/mês
- Cliente quer whitelabel completo com SSO
- Cliente quer API
- Cliente é consultoria revendendo a múltiplos clientes finais

Floor de preço: R$ 7.900/mês. Modelo de cobrança aceita: anual antecipado, mensal recorrente, ou success fee (% sobre economia gerada).

## Quando revisar este pricing

- A cada 6 meses
- Se NPS de pricing (pesquisa específica) cair abaixo de 30
- Se conversão trial→pago cair abaixo de 10%
- Se chegar em 100 clientes pagantes (escala pode mudar custos)
