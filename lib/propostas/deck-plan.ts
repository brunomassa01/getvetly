import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Analise } from "@/lib/ai/schema";
import { deckSchema, type Deck } from "@/lib/comparativos/deck-schema";
import { lerDeckCache, salvarDeckCache } from "@/lib/comparativos/deck-cache";

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

function extrairJson(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  if (ini !== -1 && fim !== -1 && fim > ini) return t.slice(ini, fim + 1);
  return t;
}

const PROMPT_SISTEMA = `Você é um designer sênior de apresentações executivas para procurement/compras. Recebe a ANÁLISE de UMA proposta comercial e PROJETA uma apresentação de parecer para a diretoria. Você INTERPRETA e CRIA o conteúdo dos slides — não copia o texto bruto.

Devolva SOMENTE um JSON: { "slides": [ {slide}, ... ] }

Tipos de slide (campo "tipo"):

1) "capa": { "tipo":"capa", "titulo":"...", "subtitulo":"..." }
   - Título = a proposta/fornecedor. Subtítulo = 1 frase com o parecer (ex: "Boa economia, mas validade curta exige decisão rápida").

2) "destaques": { "tipo":"destaques", "titulo":"Números-chave", "metricas":[ {"valor":"R$ 110.131","rotulo":"Valor negociado"} ] }
   - 2 a 4 números de maior impacto (valor negociado, desconto %, economia, prazo, alcance). Um número, um rótulo curto.

3) "recomendacao": { "tipo":"recomendacao", "titulo":"Parecer", "headline":"tese em 1 frase", "paragrafos":["...","..."] }
   - headline = o veredito. paragrafos = 2 a 3 parágrafos CURTOS (pontos fortes + ressalvas), escritos por você. NÃO cole o resumo inteiro.

4) "tabela": { "tipo":"tabela", "titulo":"Termos da proposta", "colunas":["Item","Detalhe"], "linhas":[ {"celulas":[{"texto":"Validade"},{"texto":"12/07/2025"}]} ] }
   - 5 a 8 termos que importam (escopo, período, validade, pagamento, specs/condições relevantes). Sem destaque de vencedor (é proposta única).

5) "grafico": { "tipo":"grafico", "titulo":"Tabela x Negociado", "tipo_grafico":"barra", "unidade":"R$", "series":[ {"rotulo":"Tabela","valor":250000},{"rotulo":"Negociado","valor":171677} ] }
   - Use SOMENTE se houver valor de tabela E negociado (mostra a economia). Senão, NÃO inclua.

6) "proximos_passos": { "tipo":"proximos_passos", "titulo":"Pontos a esclarecer / próximos passos", "passos":["Confirmar X","Negociar Y"] }
   - 3 a 5 ações: o que questionar, confirmar ou negociar antes de fechar. Conteúdo que VOCÊ recomenda.

REGRAS:
- Uma ideia por slide. Mate o paredão de texto.
- Sequência sugerida: capa → destaques → recomendacao → tabela → grafico (se aplicável) → proximos_passos.
- Português do Brasil. Use os dados reais da análise. Nada de placeholder.
- Responda apenas o JSON.`;

async function montarDeckAnalise(
  analise: Analise,
  empresa: string | null,
): Promise<Deck> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deckPadraoAnalise(analise);

  try {
    const client = new Anthropic({ apiKey });
    const mensagem = `Empresa que apresenta: ${empresa ?? "(não informada)"}

Análise da proposta (JSON):
${JSON.stringify(analise)}`;

    const resposta = await client.messages.create({
      model: MODELO,
      max_tokens: 4096,
      system: [
        { type: "text", text: PROMPT_SISTEMA, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: mensagem }],
    });

    const texto = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = deckSchema.safeParse(JSON.parse(extrairJson(texto)));
    if (!parsed.success) {
      console.error("[deck-analise] fora do schema, usando fallback");
      return deckPadraoAnalise(analise);
    }
    return parsed.data;
  } catch (erro) {
    console.error("[deck-analise] falha ao compor, usando fallback:", erro);
    return deckPadraoAnalise(analise);
  }
}

/**
 * Garante o deck de uma proposta: cache em disco ou compõe via IA.
 * O chamador deve ter autorizado o acesso (via buscarAnalise).
 */
export async function garantirDeckProposta(
  propostaId: string,
  analise: Analise,
  empresa: string | null,
): Promise<Deck> {
  const chave = `proposta-${propostaId}`;
  const cache = await lerDeckCache(chave);
  if (cache) return cache;
  const deck = await montarDeckAnalise(analise, empresa);
  await salvarDeckCache(chave, deck);
  return deck;
}

/** Deck mínimo a partir da análise (rede de segurança). */
function deckPadraoAnalise(analise: Analise): Deck {
  const fmt = (n: number | null) =>
    n == null ? null : `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const v = analise.valores;

  const metricas: { valor: string; rotulo: string }[] = [];
  if (fmt(v.negociado_total)) metricas.push({ valor: fmt(v.negociado_total)!, rotulo: "Valor negociado" });
  if (v.desconto_pct != null) metricas.push({ valor: `${v.desconto_pct}%`, rotulo: "Desconto" });
  if (fmt(v.economia)) metricas.push({ valor: fmt(v.economia)!, rotulo: "Economia" });

  const slides: Deck["slides"] = [
    {
      tipo: "capa",
      titulo: analise.proposta.titulo,
      subtitulo: analise.analise.resumo_executivo.slice(0, 160),
    },
  ];
  if (metricas.length > 0) {
    slides.push({ tipo: "destaques", titulo: "Números-chave", metricas: metricas.slice(0, 4) });
  }
  slides.push({
    tipo: "recomendacao",
    titulo: "Parecer",
    headline: analise.analise.resumo_executivo,
    paragrafos: analise.analise.pros.slice(0, 3),
  });

  const termos = analise.condicoes_comerciais.slice(0, 8);
  if (termos.length > 0) {
    slides.push({
      tipo: "tabela",
      titulo: "Termos da proposta",
      colunas: ["Item", "Detalhe"],
      linhas: termos.map((t) => ({ celulas: [{ texto: t.campo }, { texto: t.valor }] })),
    });
  }
  if (analise.analise.questionar.length > 0) {
    slides.push({
      tipo: "proximos_passos",
      titulo: "Pontos a esclarecer",
      passos: analise.analise.questionar.slice(0, 6),
    });
  }
  return { slides };
}
