# Pipeline de Análise com IA

Este documento explica passo a passo como uma proposta é transformada em análise estruturada. Use isto como referência quando implementar `US-012` (pipeline de análise) ou debugar uma análise ruim.

## Visão geral em 1 parágrafo

Quando o usuário sobe os arquivos da proposta, eles vão para o Supabase Storage. Um worker assíncrono pega a proposta, extrai texto de cada arquivo (usando Mistral OCR para PDFs/imagens, bibliotecas Node para XLSX/DOCX), monta um contexto único, manda para a Claude API com um prompt estruturado, recebe JSON validado por Zod e salva como `analise`. O usuário recebe notificação in-app. Custo médio: < R$ 0,50/análise. Tempo médio: < 3 min.

## Fluxo passo a passo

```
[1] Upload      → Supabase Storage (bucket: propostas-raw)
       ↓
[2] Criar proposta → propostas (status: 'uploading')
       ↓
[3] Confirmar upload → status: 'processing'
       ↓
[4] Disparar worker (Inngest / Trigger.dev / Vercel Cron)
       ↓
[5] Worker: para cada arquivo, extrair texto
       ↓
[6] Worker: montar contexto unificado
       ↓
[7] Worker: chamar Claude API com prompt estruturado
       ↓
[8] Worker: validar resposta com Zod
       ↓
[9] Worker: salvar em analises
       ↓
[10] Worker: atualizar propostas.status = 'ready'
       ↓
[11] Worker: notificar usuário (in-app + push)
```

## Detalhamento por etapa

### Etapa 5 — Extração de texto

| Formato | Ferramenta | Razão |
|---|---|---|
| PDF (texto) | `pdf-parse` ou `pdfjs-dist` | Rápido, gratuito, suficiente |
| PDF (escaneado) | Mistral OCR API | Excelente em PT-BR, barato |
| Imagem (JPG/PNG) | Mistral OCR API | Mesmo motivo |
| XLSX/XLS | `xlsx` (SheetJS) | Padrão da indústria |
| DOCX | `mammoth` | Converte para HTML/texto simples |
| CSV | `papaparse` | Padrão |

**Pseudocódigo:**

```typescript
async function extrairTexto(arquivo: PropostaArquivo) {
  switch (arquivo.mime_type) {
    case 'application/pdf':
      return await extrairPDF(arquivo);
    case 'image/png':
    case 'image/jpeg':
      return await mistralOCR(arquivo);
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return await extrairXLSX(arquivo);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extrairDOCX(arquivo);
    case 'text/csv':
      return await extrairCSV(arquivo);
    default:
      throw new Error(`Formato não suportado: ${arquivo.mime_type}`);
  }
}
```

### Etapa 6 — Contexto unificado

Junta tudo num único bloco delimitado por separadores claros que o Claude lê bem:

```
=== ARQUIVO 1: Proposta - Eletromidia.xlsx ===
[texto extraído da aba 1]
--- ABA 2: MÉTRICAS NO PERÍODO ---
[texto extraído da aba 2]
...

=== ARQUIVO 2: Midia Kit_CPTM.pdf ===
--- PÁGINA 1 ---
[texto da página 1]
--- PÁGINA 2 ---
[texto da página 2]
...

=== ARQUIVO 3: FOTOS - QUALICONSIG.pdf ===
[descrição das imagens via OCR ou alt-text gerado]
```

Limite: 150.000 tokens de contexto. Se passar, trunca os arquivos menos relevantes (PDFs de mídia kit antes da planilha de proposta).

### Etapa 7 — Prompt estruturado

Versionado em `lib/ai/prompts/analise-proposta-v1.ts`. Estrutura:

```typescript
const PROMPT_SISTEMA = `
Você é um analista sênior de compras (procurement) brasileiro com 15 anos de experiência.
Sua função: analisar a proposta comercial abaixo e retornar JSON estruturado para ser exibido em um dashboard.

REGRAS ABSOLUTAS:
1. Retorne SOMENTE JSON válido, sem texto antes ou depois.
2. Se um campo não existir na proposta, retorne null. NUNCA invente dados.
3. Português brasileiro direto, sem jargão consultor.
4. Análise crítica deve ser honesta: aponte pontos fortes E fracos.
5. Valores monetários: número (sem R$, sem ponto de milhar). Ex: 209112.38
6. Datas: YYYY-MM-DD.

ESTRUTURA OBRIGATÓRIA DO JSON:
{
  "fornecedor": { "nome": string, "cnpj": string | null, "contato": { ... } },
  "proposta": {
    "titulo": string,
    "categoria": "midia" | "software" | "servicos" | "produtos" | "brindes" | "outro",
    "escopo": string,
    "periodo_inicio": "YYYY-MM-DD" | null,
    "periodo_fim": "YYYY-MM-DD" | null,
    "validade": "YYYY-MM-DD" | null,
    "condicao_pagamento": string | null
  },
  "valores": {
    "tabela_total": number | null,
    "negociado_total": number,
    "desconto_pct": number | null,
    "economia": number | null,
    "moeda": "BRL"
  },
  "itens": [
    { "descricao": string, "quantidade": number, "valor_unitario_tabela": number, "valor_unitario_negociado": number, "valor_total_negociado": number }
  ],
  "metricas": [
    { "nome": string, "valor": string, "unidade": string | null, "descricao": string }
  ],
  "specs_tecnicas": [{ "campo": string, "valor": string }],
  "condicoes_comerciais": [{ "campo": string, "valor": string }],
  "analise": {
    "resumo_executivo": string,
    "pros": [string],
    "questionar": [string]
  },
  "metadata": {
    "arquivos_analisados": [string],
    "confianca": "alta" | "media" | "baixa",
    "campos_nao_encontrados": [string]
  }
}
`;
```

### Etapa 8 — Validação com Zod

```typescript
import { z } from 'zod';

export const AnaliseSchema = z.object({
  fornecedor: z.object({
    nome: z.string().min(1),
    cnpj: z.string().nullable(),
    contato: z.object({
      nome: z.string().nullable(),
      email: z.string().email().nullable(),
      telefone: z.string().nullable(),
    }).nullable(),
  }),
  proposta: z.object({
    titulo: z.string().min(1),
    categoria: z.enum(['midia', 'software', 'servicos', 'produtos', 'brindes', 'outro']),
    escopo: z.string().nullable(),
    periodo_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    periodo_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    validade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    condicao_pagamento: z.string().nullable(),
  }),
  valores: z.object({
    tabela_total: z.number().nullable(),
    negociado_total: z.number(),
    desconto_pct: z.number().min(0).max(100).nullable(),
    economia: z.number().nullable(),
    moeda: z.literal('BRL'),
  }),
  itens: z.array(z.object({
    descricao: z.string(),
    quantidade: z.number(),
    valor_unitario_tabela: z.number(),
    valor_unitario_negociado: z.number(),
    valor_total_negociado: z.number(),
  })),
  // ... resto
});

export type Analise = z.infer<typeof AnaliseSchema>;
```

**Se validação falhar:**
1. Salva resposta crua em `analise_edicoes` para debug
2. Tenta 1 vez retry com prompt corretivo ("seu JSON anterior estava inválido em: X. Corrija.")
3. Se falhar de novo, marca proposta como `failed` com mensagem clara

### Etapa 9 — Versionamento do prompt

Cada mudança no prompt incrementa versão: `v1.0.0` → `v1.1.0` (melhoria) ou `v2.0.0` (breaking).

Salvar em `analises.prompt_versao` para rastreabilidade. Se uma versão nova der pior em algum caso, conseguimos isolar.

## Estimativa de custo

- Mistral OCR: ~US$ 0,001/página
- Claude Sonnet 4.6: ~US$ 3/M tokens input, US$ 15/M tokens output
- Proposta média: 20k tokens input + 4k tokens output
- Custo por análise: ~US$ 0,12 = R$ 0,60

**Limite hard de custo**: se 1 análise passar de US$ 2 (~R$ 10), abortar e notificar admin.

## Cache e otimização

- Arquivos idênticos (mesmo hash) reutilizam texto extraído (`proposta_arquivos.texto_extraido`)
- Prompt idêntico + contexto idêntico → cache de resposta por 24h (Redis ou Upstash)
- Se cliente refizer análise sem mudança, devolve do cache (custo zero, latência < 100ms)

## Worker: onde rodar

Opções avaliadas:

| Solução | Pros | Contras |
|---|---|---|
| **Inngest** (recomendado) | Free tier generoso, retry built-in, observability, ótimo DX | Mais 1 conta |
| Vercel Cron + Edge Functions | Tudo no Vercel | Sem retry nativo, timeout 60s |
| Trigger.dev | Excelente DX, retry, scheduler | Mais 1 conta |
| AWS Lambda + SQS | Industrial | Setup pesado, fora da stack Vercel-first |

**Decisão**: Inngest. Free até 50k execuções/mês. Cobre o piloto inteiro.

## Como debugar análise ruim

Use o skill `debug-pipeline-ai` (em `.claude/skills/debug-pipeline-ai/`). Resumo:

1. Identifique a `analise.id` no banco
2. Recupere `analises.payload` (resposta da IA), `prompt_versao`, `tokens_input`, `tokens_output`
3. Recupere os `proposta_arquivos.texto_extraido` originais
4. Replay localmente: rode `pnpm dev:ai-replay <analise_id>` (script auxiliar)
5. Identifique se erro foi em parsing, prompt ou validação
6. Se foi prompt: ajuste, suba versão, teste com mesma proposta + 3 outras pra não regredir
7. Salve test fixture do caso em `__tests__/fixtures/propostas/`

## Limites de tier no pipeline

| Tier | Análises/mês | Comparativos/mês | Storage |
|---|---|---|---|
| Starter | 5 | 2 | 500 MB |
| Pro | 50 | 20 | 5 GB |
| Business | 200 | 100 | 25 GB |
| Enterprise | ilimitado | ilimitado | sob acordo |

Hard limit: bloqueia upload se passar do limite no mês. Soft limit (80%): notifica.

## Próximos passos para evolução do pipeline

- v2: extrair pontos-chave por categoria com prompts especializados (mídia tem CPM, software tem licença/usuário, etc.)
- v2: detecção automática de cláusulas problemáticas (reajuste, multa abusiva, exclusividade)
- v3: análise comparativa de N propostas em uma chamada (mais barato e mais coerente que 1 por 1)
- v3: tradução para EN/ES se cliente operar fora do Brasil
