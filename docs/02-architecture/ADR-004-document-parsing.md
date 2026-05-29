# ADR-004: Parsing de documentos — Mistral OCR para PDF/imagem, bibliotecas Node nativas para o resto

**Status**: Aceito
**Data**: 2026-05-28
**Decisor**: Bruno Romualdo Marinho

## Contexto

Antes de qualquer analise por IA, precisamos transformar o arquivo enviado pelo cliente em texto limpo (idealmente markdown estruturado). Propostas chegam em todos os formatos imaginaveis: PDF nativo (gerado por Word/InDesign), PDF escaneado, XLSX com varias abas e celulas mescladas, DOCX, CSV, JPEG/PNG de proposta tirada por celular, e ocasionalmente ZIP com tudo junto. A qualidade da extracao determina diretamente a qualidade da analise — se a tabela de precos vier embaralhada, o relatorio mente.

Restricoes: (1) PT-BR e default, OCR precisa reconhecer acentuacao e cedilha sem ruido; (2) tabelas em PDF (especialmente com merged cells, cabecalhos rotacionados, valores em moeda BRL) sao o caso de uso critico; (3) custo por documento precisa ficar abaixo de centavos de dolar para nao destruir margem; (4) latencia importa — esperar 2 minutos so para parsing e inaceitavel; (5) preferimos rodar no nosso runtime (Node/Vercel) sempre que possivel, evitando puxar Python serverless so para uma biblioteca; (6) zero dados sensiveis em filas de treinamento de terceiros.

Premissas: o pipeline de parsing roda em background job (nao em request sincrona) com timeout generoso. O output e markdown + metadados (numero de paginas, abas, hash do arquivo), que vai para o estagio de IA (ADR-003).

## Decisao

Usamos **Mistral OCR (API)** como motor principal para **PDFs complexos e imagens** — tem qualidade comprovada em PT-BR, preserva estrutura de tabelas em markdown, custa pouco e tem latencia baixa. Para os outros formatos usamos **bibliotecas Node nativas**, mantendo tudo no mesmo runtime: `xlsx` (SheetJS) para XLSX, `mammoth` para DOCX, `csv-parse` para CSV, `unzipper` para ZIP. PDFs simples e texto (gerados digitalmente, com camada de texto) sao primeiro tentados com `pdf-parse` local — se a qualidade for ruim (heuristica: razao texto/pagina muito baixa), caimos para Mistral OCR. Toda saida e normalizada para markdown UTF-8 com cabecalhos por secao/aba.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|---|---|---|
| **Mistral OCR + Node libs (escolhida)** | Otima qualidade PT-BR; preserva tabelas em markdown; preco baixo (centavos por doc); SDK simples; sem Python | Vendor adicional (Mistral); ainda jovem, API pode mudar; OCR de imagens muito ruidosas pode falhar |
| **AWS Textract** | Maduro; bom em formularios; integra com S3 | Caro por pagina; PT-BR funciona mas sem o capricho de tabelas em markdown; precisa de credenciais e regiao AWS so para isso |
| **Google Document AI** | Excelente em layouts complexos; processadores especializados | Caro; setup pesado (project, service account, processor por tipo); GCP nao esta no resto da stack — custo cognitivo alto |
| **Unstructured.io (cloud ou self-hosted)** | Pipeline pronto para LLMs; suporta dezenas de formatos numa API so | Qualidade em PT-BR e tabelas brasileiras inconsistente nos testes; self-host pesado; cloud cara em volume |
| **pdfplumber/pypdf via funcao Python serverless** | Open-source, sem custo de API; controle total | Adiciona runtime Python so para parsing; OCR nao incluso (precisa Tesseract, qualidade fraca em PT-BR sem tuning); aumenta superficie operacional |
| **Tesseract (self-host)** | Gratuito | Qualidade em PT-BR muito inferior a Mistral OCR para documentos reais; precisa GPU/CPU dedicada para latencia aceitavel |

## Consequencias

Positivas:
- Quase todo o pipeline roda em Node, dentro do mesmo deploy da app — sem orquestrar Python.
- Mistral OCR entrega markdown ja estruturado, o que ajuda o Claude a "ver" tabelas direito.
- Custo de parsing fica em centavos por documento mesmo em propostas de 80 paginas.
- Fallback claro: tenta local, escala para Mistral OCR so quando precisa — economiza dinheiro em propostas simples.
- ZIP, DOCX, XLSX e CSV nao dependem de servico externo — funciona offline em dev.

Negativas / trade-offs aceitos:
- **Dependencia de Mistral** para o caso mais comum (PDF). Mitigacao: abstrair atras de interface `DocumentParser` — trocar para Textract/DocAI seria troca de adapter, nao reescrita.
- **OCR pode interpretar mal valores monetarios** em PDFs escaneados de baixa qualidade. Mitigacao: mostrar texto extraido para o usuario revisar antes de gerar relatorio em casos onde confidence vier baixo.
- **Heuristica "PDF simples vs complexo"** vai errar as vezes — algum PDF nativo vai cair em OCR desnecessariamente (custo extra) ou vice-versa (qualidade ruim). Aceitavel; ajustamos com dados reais.
- **XLSX com formulas e macros** e tratado como dados estaticos (valor calculado). Aceitavel — propostas comerciais raramente exigem reexecucao de formula.
- **Imagens muito ruins** (foto tremida de celular) sempre serao limite — vamos comunicar isso ao usuario com erro claro, nao tentar adivinhar.

## Quando revisar

- Se taxa de "extracao com erro de tabela" passar de **5% das propostas** segundo feedback dos usuarios.
- Quando volume passar de **50.000 paginas/mes** — vale renegociar com Mistral ou comparar Textract/DocAI a preco de escala.
- Se Mistral OCR tiver incidente prolongado ou aumentar preco mais de 50%.
- Se algum cliente exigir parsing 100% on-premise / sem terceiros — sinal para self-host (Tesseract+layout) como modulo opcional.
- Quando surgir formato novo recorrente (ex.: P7S assinado digitalmente, e-mail .eml com proposta embarcada) que mereca biblioteca dedicada.
