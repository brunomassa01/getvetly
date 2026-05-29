# ADR-005: Pagamentos e billing — Stripe com PIX habilitado para o Brasil

**Status**: Aceito
**Data**: 2026-05-28
**Decisor**: Bruno Romualdo Marinho

## Contexto

Somos um SaaS B2B com modelo de assinatura recorrente (planos mensais e anuais, com possivel cobranca por uso adicional — analises avulsas alem da cota). Os clientes sao empresas brasileiras, predominantemente PMEs e mid-market, que precisam pagar com **cartao de credito corporativo, boleto ou PIX**, e querem **nota fiscal** automatica. A equipe e enxuta — nao temos financeiro dedicado — entao o gateway tem que automatizar o ciclo completo: cadastro de metodo de pagamento, cobranca recorrente, dunning (retentativa em falha), upgrade/downgrade prorratado, cancelamento, reembolso, e portal de auto-servico onde o cliente atualiza cartao sem abrir ticket.

Restricoes: (1) precisamos de PIX recorrente ou pelo menos PIX em primeira cobranca/avulsa, porque cartao corporativo de PME falha muito; (2) integracao com Next.js/TypeScript precisa ser rapida — nao queremos passar 3 semanas costurando webhooks; (3) portal de auto-servico embutido (sem precisarmos construir a UI inteira de "minhas faturas") economiza meses; (4) qualidade de API e SDK conta — vamos viver dentro dessa documentacao por anos; (5) NF-e e tema separado e sera resolvido por integracao com servico fiscal (NFe.io, eNotas) — fora do escopo deste ADR.

Premissas: aceitamos cobrar em BRL via entidade brasileira (Stripe Brasil ja opera localmente desde 2024 com Pix). Para clientes globais futuros, Stripe ja cobre cartoes internacionais sem mudanca de stack.

## Decisao

Adotamos **Stripe** como gateway unico, usando **Subscriptions** para os planos recorrentes, **Checkout** para a primeira compra, **Customer Portal** hospedado pela Stripe para auto-servico (trocar cartao, baixar faturas, cancelar), e **Webhooks** para sincronizar status (active, past_due, canceled) com nossa tabela de `workspaces`. **PIX habilitado** como metodo de pagamento via Stripe BR. Toda logica de plano (limites, features) lida com o estado da subscription como fonte de verdade — nao guardamos copia paralela de "esta pago" alem do espelho via webhook.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Stripe BR com PIX (escolhida)** | API e docs lideres da industria; Customer Portal pronto; SDK TS de primeira classe; PIX disponivel; webhooks confiaveis; trial gratis e cupons triviais; cartao internacional incluso de graca | Taxa um pouco maior que players locais; suporte a boleto historicamente fraco (melhorou); preco em USD para alguns servicos; menos integrado a ERPs BR que Pagar.me/Iugu |
| **Pagar.me (Stone)** | Player BR forte; boleto + PIX maduros; bom suporte local; checkout transparente | API/SDK menos polidos; Customer Portal equivalente nao e tao bom; menos ergonomia em TS; antifraude as vezes barra cobrancas legitimas |
| **Iugu** | Otima cobertura de meios BR (PIX, boleto, cartao); foco em SaaS; emissao de NFS-e integrada | API menos moderna; documentacao desigual; menos popular entre devs TS; risco de empresa menor |
| **Asaas** | Forte para microempresas; PIX e boleto excelentes; preco baixo; integra com NF | Mais "ferramenta de gestao financeira" que "infra de SaaS"; subscription com prorata e dunning menos sofisticado |
| **Vindi** | Especialista em recorrencia BR; bom dunning; suporta carteiras digitais | API mais antiga; menos atualizada; integracao TS exige mais codigo cola |
| **Cielo / adquirente direto** | Taxa potencialmente menor; relacao direta com bandeira | Construir toda camada de subscription, portal, webhooks, retry — meses de trabalho que nao temos |

## Consequencias

Positivas:
- Customer Portal economiza **meses** de UI propria (faturas, troca de cartao, historico, cancelamento).
- Stripe webhooks sao referencia da industria — sabemos lidar com replay, idempotencia, ordering.
- SDK TS oficial mantido pela Stripe, com tipos completos — Claude Code gera integracao limpa.
- PIX cobre clientes que reclamam de cartao; cartao internacional cobre cliente gringo futuro sem migracao.
- Trials, cupons, prorata em upgrade/downgrade, taxas por uso (metered billing) sao tudo configuracao, nao codigo.
- Painel da Stripe ja serve de "ERP financeiro" basico para o fundador no comeco.

Negativas / trade-offs aceitos:
- **Taxa por transacao maior** que players locais em alguns cenarios. Aceitavel pelo tempo economizado.
- **Boleto bancario continua sendo ponto fraco** — clientes que so pagam por boleto podem ser melhor atendidos por Pagar.me/Asaas. Mitigacao: oferecer PIX como substituto natural do boleto; se virar pedido recorrente, adicionar gateway secundario.
- **Conciliacao com NF-e** precisa de servico fiscal a parte (NFe.io, eNotas) — nao e tudo-em-um como Iugu.
- **Dependencia critica de um gateway** — instabilidade na Stripe trava cobranca. Mitigacao: webhooks idempotentes, retry, monitor de falhas; em ultimo caso, suporte manual via PIX direto enquanto o gateway nao volta.
- **Stripe e empresa americana** — sujeita a politicas que podem mudar (ja banimentos arbitrarios de setores). Aceitavel pelo nosso vertical (procurement), baixo risco.

## Quando revisar

- Quando volume mensal passar de **R$ 200k/mes** em assinaturas — vale renegociar taxa com Stripe ou comparar Pagar.me/Iugu com dados reais de churn por meio de pagamento.
- Se **mais de 20% dos leads pedirem boleto** explicitamente e PIX nao resolver — adicionar gateway secundario para boleto.
- Se Stripe BR aumentar taxas significativamente ou descontinuar suporte a PIX recorrente.
- Quando entrarmos em enterprise (tickets acima de R$ 5k/mes) — provavelmente vamos faturar via NF + boleto/PIX direto fora de gateway de cartao.
- Se houver incidente regulatorio (BACEN, LGPD) que afete operacao da Stripe no Brasil.
