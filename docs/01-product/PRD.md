# Product Requirements Document

## Visão

Tornar a análise e aprovação de propostas comerciais 10× mais rápida para times de compras de PMEs e empresas mid-market no Brasil, com IA que entrega leitura crítica honesta — não relatório bonito.

## Problema

Gestores de compras, supply chain e financeiro recebem dezenas de propostas por mês de fornecedores diferentes. Hoje, o fluxo é manual e doloroso:

1. Cada proposta chega em formato diferente (PDF bonito, planilha bagunçada, e-mail texto, fotos de orçamento de WhatsApp).
2. Comparar 3 cotações da mesma categoria leva 2-4 horas, abrindo arquivos lado a lado.
3. Análise honesta sobre riscos (multas escondidas, reajustes, exclusões) raramente é feita por falta de tempo.
4. Apresentar para diretoria/aprovador exige montar slides ou docs do zero.
5. Histórico de fornecedores fica em pastas no Drive — ninguém lembra a cotação do ano passado.
6. Aprovação vai por e-mail solto, sem rastro.

Resultado: decisões ruins por pressa, fornecedores ruins ficando porque ninguém comparou direito, dinheiro deixado na mesa, retrabalho.

## Solução

Um SaaS web onde o gestor:

1. **Joga os arquivos** (PDF, XLSX, DOCX, imagens) e a IA extrai automaticamente.
2. **Recebe relatório padronizado em minutos** com resumo executivo, valores, métricas e análise crítica honesta (pontos a favor e pontos para questionar).
3. **Compara N propostas concorrentes** lado a lado com matriz de critérios e vencedor por categoria.
4. **Compartilha link** com a diretoria/aprovador para revisar, anotar e aprovar.
5. **Consulta histórico** do fornecedor (todas as cotações anteriores, mudanças de preço, qualidade da relação).
6. **Personaliza com a marca da própria empresa** (whitelabel embutido).

## Diferencial competitivo

| Concorrente | Foco | Preço | Lacuna que exploramos |
|---|---|---|---|
| **Coupa** | Source-to-pay enterprise | US$ 50k+/ano | Caro demais para PME; setup pesado |
| **GEP** | Enterprise procurement suite | US$ 30k+/ano | Mesma coisa |
| **Linkana** (BR) | Compliance e cadastro de fornecedor | R$ 2-10k/mês | Não analisa propostas, foca em qualificação |
| **Mercanto** (BR) | Cotação eletrônica | R$ 1-5k/mês | Sem IA analítica, foca em receber cotações |
| **Promo** (BR) | Marketplace de fornecedores | Comissão | Não é ferramenta de análise |
| **Nosso produto** | Análise + comparação + aprovação com IA | R$ 297-2.490/mês | Preço PME + IA analítica + UX moderna |

**Tese de posicionamento**: "O Linkana faz o fornecedor entrar. A gente faz a proposta dele ser aprovada com critério em metade do tempo."

## Escopo do MVP (versão 1.0)

### Funcionalidades core (devem estar prontas para vender)

1. **Autenticação e workspaces** — signup, login com e-mail/senha + magic link, recuperação de senha, criação de workspace por empresa, convite de membros.
2. **Upload e análise de proposta única** — drag-and-drop de até 10 arquivos por proposta (50MB cada), extração automática, geração de relatório HTML padronizado.
3. **Comparativo de propostas** — selecionar 2-5 propostas e gerar relatório comparativo com matriz.
4. **Histórico de fornecedores** — listagem, busca, timeline de cotações por fornecedor.
5. **Link compartilhável** — gerar URL única com expiração configurável (7/15/30 dias) para revisor externo (não-usuário) ver o relatório, anotar e aprovar/recusar.
6. **Whitelabel básico** — logo, cor primária, nome da empresa nos relatórios.
7. **Pagamento e billing** — checkout via Stripe, 4 tiers, gestão de assinatura, upgrade/downgrade, cancelamento.
8. **Configurações de workspace** — dados da empresa, time, integração com e-mail.

### Funcionalidades fora do MVP (vêm depois)

- Geração e assinatura de contrato (D4Sign / Clicksign) — v2
- Integração com ERP (TOTVS, SAP, Sankhya) — v3
- API pública para parceiros — v3
- App mobile — v4
- Marketplace de fornecedores qualificados — v4
- Análise preditiva (previsão de reajuste, alerta de fim de contrato) — v3

## Métricas de sucesso

### Métricas de produto

- **Time-to-analysis**: do upload do primeiro arquivo ao relatório pronto. Meta: < 3 minutos.
- **NPS pós-análise**: pesquisa logo após ver o relatório. Meta: > 50.
- **Análises por workspace ativo/mês**: indicador de uso recorrente. Meta: > 8.
- **Taxa de aprovação via link compartilhado**: % das análises que viram decisão registrada. Meta: > 60%.

### Métricas de negócio

- **MRR (Monthly Recurring Revenue)** — receita recorrente
- **Churn mensal**: meta < 5% no primeiro ano
- **CAC (Customer Acquisition Cost)**: meta < 3× MRR do primeiro mês
- **LTV/CAC**: meta > 3:1 ao final do primeiro ano
- **Conversão trial → pago**: meta > 15%

## Restrições não-negociáveis

1. **LGPD-compliant desde o dia 1.** Dados de fornecedores e propostas são sensíveis. Veja `docs/06-compliance/lgpd-checklist.md`.
2. **Português brasileiro como primeiro idioma.** Interface, e-mails, mensagens de erro, relatórios.
3. **Acessível a leigos.** Comprador sênior de PME precisa conseguir usar sem treinamento. Onboarding guiado obrigatório.
4. **Dados do cliente ficam no Brasil.** Supabase tem região São Paulo. Não usar S3 us-east sem motivo forte.
5. **IA não decide sozinha.** A análise crítica é input para o humano decidir. Nunca "aprovação automática".

## Premissas técnicas

- Cada workspace tem entre 5-200 propostas/mês no início. Sistema deve escalar a 5.000 propostas/mês por workspace sem reescrita.
- Cada proposta tem em média 3-5 arquivos, totalizando 5-30 MB.
- Pico de uso: segunda-feira de manhã (8h-11h) — compras revisitam cotações da semana.
- Acesso primário: desktop. Mobile é leitura/aprovação rápida (link compartilhado).

## Hipóteses a validar com clientes piloto

1. **Compradores pagam R$ 297-897/mês** pela ferramenta sozinhos (sem precisar aprovar com TI).
2. **A leitura crítica honesta é o diferencial** que ganha a venda, não a velocidade.
3. **Link compartilhável vira gatilho de aquisição** — diretoria vê o relatório bonito, pergunta "quem fez?", vira lead.
4. **Histórico vira lock-in** — depois de 3 meses, ninguém troca de ferramenta porque perderia o histórico.

Estas hipóteses devem ser testadas com os primeiros 5 clientes piloto (idealmente conhecidos do Bruno).

## Riscos do produto

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| IA gera análise ruim/genérica | Média | Alto | Prompt forte + revisão manual antes de mostrar; loop de melhoria |
| Concorrente grande copia | Baixa | Médio | Falta foco PME no Brasil; vamos rápido |
| LGPD: vazamento de proposta sensível | Baixa | Crítico | RLS obrigatório, criptografia, auditoria, DPO terceiro |
| Custo de IA explode (tokens caros) | Média | Alto | Caching, Mistral OCR antes do Claude (mais barato), cobrar por uso após limite |
| Cliente não confia em IA para análise crítica | Média | Médio | Onboarding mostrando exemplos; revisor humano disponível no tier Pro+ |
