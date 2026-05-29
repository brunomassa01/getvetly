# ADR-003: Pipeline de IA — parsing local, Claude API com saida estruturada validada por Zod

**Status**: Aceito
**Data**: 2026-05-28
**Decisor**: Bruno Romualdo Marinho

## Contexto

O nucleo de valor do produto e transformar uma proposta comercial bruta (PDF, planilha, DOCX, imagem) num relatorio estruturado em portugues que destaca valores, descontos, condicoes de pagamento, riscos contratuais e pontos a questionar. A qualidade da analise determina se o cliente confia no produto. Os documentos chegam em portugues brasileiro, com termos especificos de procurement ("BDI", "ICMS-ST", "CIF/FOB", "tabela cheia x negociado", "ad valorem"), e variam de meia pagina a propostas tecnicas de 80+ paginas.

Restricoes: (1) latencia razoavel — usuario espera relatorio em menos de 60 segundos para propostas tipicas; (2) custo por analise precisa caber num plano SaaS de R$ 200-800/mes; (3) saida tem que ser estruturada (JSON valido com schema conhecido) para alimentar o template do relatorio sem trabalho de regex no front; (4) qualidade em PT-BR e nao-negociavel, modelos que "sabem portugues" mas tropecam em jargao contabil brasileiro nao servem; (5) precisamos poder evoluir o prompt sem fazer fine-tuning.

Premissas: documentos chegam ja parseados em texto/markdown antes de irem para o LLM (ADR-004 cobre o parsing). O LLM recebe um contexto unico, ja consolidado, com o texto da proposta + metadados + instrucoes — nao usamos agentes multi-step para a analise principal.

## Decisao

Adotamos pipeline em tres estagios: (1) **parsing local** com Mistral OCR (PDFs complexos e imagens) e bibliotecas Node nativas (xlsx, mammoth, csv-parse) gera um markdown limpo do documento; (2) esse markdown e enviado como **contexto unico para a Claude API** (Anthropic), usando o modelo Sonnet mais recente, com prompt versionado e exemplos few-shot de propostas reais; (3) a resposta vem como **JSON estruturado** (via tool use / structured outputs) e e **validada por Zod** antes de qualquer uso — falha de schema dispara retry com feedback do erro. Toda chamada e idempotente por hash do input para evitar reprocessamento custoso.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Claude Sonnet (Anthropic) — escolhida** | Melhor qualidade em PT-BR para texto longo no nosso benchmark interno; tool use confiavel; contexto de 200k; preco competitivo; menor taxa de alucinacao em tabelas | Vendor unico; sem fine-tuning publico; dependencia de uma so empresa para o nucleo do produto |
| **OpenAI GPT-4o / o-series** | Ecosistema vastissimo; Structured Outputs nativo via JSON Schema; mais barato em alguns tiers | Em testes nossos, qualidade em PT-BR para contratos brasileiros ficou atras da Claude (mais alucinacao em valores, pior leitura de tabelas com merged cells) |
| **Google Gemini 1.5/2.0** | Contexto gigante (1M+ tokens); multimodal nativo (poderia pular OCR); preco agressivo | API menos previsivel (rate limits, mudancas); structured output menos maduro que Claude/OpenAI; qualidade em PT-BR tecnico mediana |
| **Modelos open-source (Llama 3.1 70B, Qwen, Mistral Large self-hosted)** | Sem custo por token; dados nunca saem da nossa infra; sem vendor lock | Qualidade em PT-BR tecnico ainda inferior; custo de GPU mensal supera o de API ate volumes muito altos; equipe nao tem capacidade de MLOps |
| **Hibrido (Claude para analise critica + modelo barato para extracao simples)** | Otimiza custo | Complexidade prematura; dois prompts para manter, dois sistemas de fallback; deixar para depois |

## Consequencias

Positivas:
- Qualidade percebida do relatorio fica no topo da categoria desde o dia 1.
- JSON validado por Zod elimina classe inteira de bugs de "o LLM retornou string onde esperavamos numero".
- Cache por hash do input torna analise repetida (mesma proposta reaberta) gratis.
- Prompt versionado e auditavel — sabemos exatamente qual versao gerou cada relatorio salvo.
- Trocar de modelo (Claude Opus vs Sonnet, ou futura familia) e mudanca de uma linha + reteste.

Negativas / trade-offs aceitos:
- **Lock-in com Anthropic** para o que mais importa. Mitigacao: abstrair a chamada atras de uma interface (`AIProvider`) para que trocar exija reescrita do prompt, nao do app inteiro.
- **Custo variavel** — propostas de 80 paginas custam significativamente mais que de 2 paginas. Mitigacao: precificacao por analise nos planos pagos, hard cap de paginas no plano free.
- **Latencia depende da API da Anthropic** — picos podem estourar nossos 60s. Mitigacao: streaming progressivo no UI ("estou lendo a proposta...", "estou montando o comparativo...") e timeout com retry.
- **Sem fine-tuning** significa que melhorias de qualidade vem so de prompt engineering e few-shot. Aceitavel — modelos frontier melhoram sozinhos.
- **Risco politico**: se Anthropic for adquirida ou mudar termos de uso de forma hostil, precisamos reagir rapido.

## Quando revisar

- Quando custo de IA passar de **30% da receita bruta** — sinal para considerar modelo mais barato em tarefas leves ou self-host.
- Se aparecer modelo open-source com qualidade comprovada em PT-BR tecnico igual ou superior a Claude Sonnet.
- Quando volume passar de **10.000 analises/mes** — escala em que negociar contrato direto com Anthropic ou avaliar Bedrock/Vertex faz sentido.
- Se taxa de erro de schema (Zod falhando) passar de 2% — sinal para revisar prompt ou modelo.
- Se a Anthropic mudar termos de privacidade/treinamento de forma incompativel com promessa que fazemos aos clientes.
