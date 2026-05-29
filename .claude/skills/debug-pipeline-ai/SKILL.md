---
name: debug-pipeline-ai
description: Investiga e corrige falhas na pipeline de análise de propostas com Claude API, desde extração de texto até parsing da resposta. Usa esta skill quando o Bruno disser "a análise da proposta X saiu errada", "Claude alucinou nessa análise", "o relatório veio com dado inventado", "a extração ficou ruim", "o JSON da resposta da IA quebrou", "esse cliente recebeu análise furada", "a IA não pegou o preço corretamente", ou qualquer relato de output incorreto da pipeline de IA.
---

# Debug da Pipeline de IA

## Quando esta skill dispara

Dispara quando uma análise produzida pela pipeline (PDF -> texto -> Claude -> JSON -> relatório) sai errada. O problema pode estar em qualquer etapa: extração, montagem do prompt, resposta do modelo, parsing/validação, ou renderização final.

Frases-gatilho típicas:
- "A análise da proposta X saiu errada"
- "Claude alucinou nessa análise"
- "O relatório veio com dado inventado"
- "A extração ficou ruim"
- "O JSON da resposta quebrou"
- "A IA não pegou o preço corretamente"
- "Cliente reclamou que faltou um item da proposta"

## Fluxo passo a passo

### 1. Localizar a análise no banco

Pergunte ao Bruno o ID da análise (geralmente vem no print do cliente ou no link do relatório). Se não souber:

```sql
select id, proposal_id, status, created_at, prompt_version
from analyses
where workspace_id = '<ws>'
order by created_at desc
limit 20;
```

Anote: `analysis.id`, `proposal.id`, `prompt_version`, `model`.

### 2. Recuperar artefatos da execução

Toda análise persiste:
- **Arquivo original**: `proposals.file_url` (PDF/DOCX/XLSX no Supabase Storage)
- **Texto extraído**: `proposals.extracted_text`
- **Prompt final**: `analyses.prompt_sent` (com variáveis substituídas)
- **Resposta crua do Claude**: `analyses.raw_response` (string antes do parse)
- **JSON parseado**: `analyses.parsed_output` (após Zod)
- **Erros**: `analyses.error` + `audit_log` + Sentry

Baixe os 4 primeiros para uma pasta local de debug: `tmp/debug/<analysis-id>/`.

### 3. Identificar onde falhou

Vá pela ordem da pipeline. **Pare na primeira que estiver errada**:

#### 3.1 Extração de texto

Abra `extracted_text`. Comparare com o PDF.
- Texto vazio? -> PDF é só imagem, precisa de OCR (Tesseract / Claude Vision).
- Texto bagunçado (colunas misturadas)? -> trocar extrator (pdf-parse -> unpdf -> pdfjs).
- Caracteres estranhos? -> encoding errado, forçar UTF-8.
- Falta uma página? -> bug no loop, verificar limite de páginas.

#### 3.2 Prompt enviado

Abra `prompt_sent`. Cheque:
- Todas as variáveis foram substituídas? (sem `{{algo}}` literal)
- Trecho do texto cabe no contexto? (limite de tokens)
- Instruções de formato JSON estão presentes?
- Versão do prompt é a esperada? (`prompt_version`)

#### 3.3 Resposta crua do Claude

Abra `raw_response`. Cheque:
- É JSON válido? Cole em `jq` ou `JSON.parse`.
- Modelo respondeu com prosa antes/depois do JSON? (precisa de extração)
- Inventou campos que não pediu?
- Errou número/data específica? Compare com o `extracted_text` — se o dado **está** no texto e a IA errou, é hallucination de modelo.

#### 3.4 Parsing/Validação Zod

Veja `analyses.error`. Se contém `ZodError`:
- Campo esperado faltou na resposta da IA?
- Tipo veio diferente (string em vez de number)?
- Enum com valor fora da lista?

#### 3.5 Render do relatório

Se o JSON está certo mas o HTML/PDF saiu errado, problema é no template — vá pra `components/relatorio/`.

### 4. Propor fix específico

Cada categoria tem fix típico:

| Onde falhou | Fix |
|-------------|-----|
| Extração: PDF imagem | Adicionar OCR antes de mandar pro Claude |
| Extração: colunas misturadas | Trocar lib de extração + teste de regressão |
| Prompt: variável não substituída | Bug no template, corrigir e adicionar teste |
| Prompt: contexto estourado | Chunking + map-reduce |
| Resposta: JSON inválido | Pedir `response_format: {"type":"json_object"}` ou wrapper de tool use |
| Resposta: hallucination | Reforçar instrução "use SOMENTE dados presentes no texto" + adicionar exemplos |
| Zod: campo opcional virou obrigatório | Ajustar schema OU prompt, decidir qual fonte de verdade |
| Render: dado faltando | Fallback no template + log de warning |

Mostre o fix proposto ao Bruno **antes** de aplicar.

### 5. Testar com a MESMA proposta

Rode replay localmente:

```bash
npm run replay -- --analysis-id=<id>
```

Isso re-roda a pipeline com:
- Mesmo arquivo (`proposals.file_url`)
- Prompt **novo** (versão em desenvolvimento)
- Modelo configurado em `.env.local`
- Salva resultado em `tmp/replay/<id>/`

Compare `tmp/replay/<id>/parsed_output.json` com o erro original. Resolveu?

### 6. Garantir não-regressão

Se o fix foi no prompt:
- Pegue 5-10 análises antigas que estavam OK
- Rode replay com o prompt novo
- Confirme que continuam OK
- Suba a versão: `prompt_version = current + 1`
- Salve o prompt em `prompts/v<NN>_<nome>.md`

Se o fix foi no Zod:
- Adicione case de teste com a resposta crua que quebrou
- Garanta que o novo schema aceita resposta válida + rejeita inválida

### 7. Documentar a falha

Em `docs/03-pipeline/debug-log.md` adicione entrada:

```md
## 2026-05-28 — Análise prop-abc123 não pegou desconto

**Sintoma:** Cliente Acme viu valor cheio na linha "Total final" mas a proposta
tinha 12% de desconto explicito.

**Causa raiz:** Prompt v07 não instruía a IA a procurar desconto em rodapés.

**Fix:** Prompt v08 adicionou seção "Procure descontos em rodapés, observações
e termos de pagamento". Replay nos últimos 30 dias: 0 regressões.

**Commit:** abc123
```

## Regras

### Versionamento de prompt

- Prompts ficam em `prompts/v<NN>_<nome>.md` versionados no git.
- Tabela `prompts` tem `id`, `version`, `body`, `created_at`.
- Cada `analysis` referencia `prompt_version` usada.
- **Nunca edite uma versão já em produção** — crie a v(N+1).

### Replay sempre que possível

Toda análise deve ser reproduzível offline. Se não conseguiu replay, **primeiro corrige a infra de replay**, depois ataca o bug.

### Hallucination guard

Se a IA está inventando dados, adicione validação cruzada:

```ts
const validated = parsedOutput.itens.filter(item =>
  extractedText.toLowerCase().includes(item.descricao.toLowerCase().slice(0, 20))
);

if (validated.length < parsedOutput.itens.length) {
  await logWarning("possivel_hallucination", {
    analysis_id,
    inventados: parsedOutput.itens.length - validated.length,
  });
}
```

### Zod estrito mas com fallback

Para campos opcionais que a IA às vezes esquece:

```ts
const Analise = z.object({
  itens: z.array(Item).min(1),
  desconto_percentual: z.number().min(0).max(100).optional().default(0),
  observacoes: z.string().optional().default(""),
});
```

Para campos obrigatórios faltando, **re-tente com prompt reforçado** antes de quebrar:

```ts
try {
  return Analise.parse(json);
} catch (e) {
  if (attempt < 2) return analyze(text, attempt + 1, "REFORCED");
  throw new PipelineError("INVALID_JSON_AFTER_RETRY", { cause: e });
}
```

### Logs do Sentry

Toda exceção da pipeline deve carregar contexto:

```ts
Sentry.captureException(error, {
  tags: { pipeline_stage: "parse" },
  extra: { analysis_id, prompt_version, model },
});
```

Filtre no Sentry por `tags.pipeline_stage` para ver onde mais quebra.

## Exemplos práticos

### Exemplo 1: IA inventou item que não estava na proposta

**Diagnóstico:** hallucination. `extracted_text` não contém o item, mas `parsed_output.itens` contém.

**Fix:** adicionar validação cruzada (ver "Hallucination guard"). Reforçar no prompt: "Liste APENAS itens que aparecem literalmente no texto. Se não tem certeza, omita."

### Exemplo 2: JSON quebrou com vírgula sobrando

**Diagnóstico:** `raw_response` é `{"a": 1, "b": 2,}` — vírgula final.

**Fix curto:** usar `response_format: { type: "json_object" }` na chamada do Claude. Modelo passa a garantir JSON válido.

**Fix longo:** se não puder usar JSON mode, parser tolerante (`json5` ou regex de limpeza) + log.

### Exemplo 3: PDF veio só com imagens

**Diagnóstico:** `extracted_text` vazio ou com 3 caracteres.

**Fix:** detectar e rotear pra OCR:

```ts
if (extractedText.length < 100) {
  extractedText = await runOCR(fileBuffer); // Tesseract ou Claude Vision
}
```

Adicionar coluna `proposals.extraction_method` (`'pdf-text' | 'ocr' | 'mixed'`) pra rastrear.

## O que NÃO fazer

- **Não edite o prompt em produção sem replay** — você quebra outras 200 análises em uso.
- **Não conclua "Claude alucinou" sem checar o texto extraído** — muitas vezes o texto que chegou pro Claude já estava ruim.
- **Não tape com `try/catch` engolindo erro** — log + Sentry + propagar com contexto.
- **Não use `any` no schema da resposta** — Zod estrito é a barreira contra hallucination.
- **Não reprocesse a análise direto em produção pro cliente** — mostre fix em staging primeiro.
- **Não delete a análise errada do banco** — mantenha para auditoria e treinamento.
- **Não mude o modelo (sonnet -> opus) "pra ver se melhora"** — primeiro entenda a causa.
- **Não esqueça de versionar o prompt corrigido** — sem versão, não dá pra reproduzir.
- **Não confie em uma única amostra** — rode replay em pelo menos 10 análises para validar o fix.
- **Não suba prompt novo sem teste de regressão** — `npm run prompts:regression` antes do merge.
