import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Comparativo } from "@/lib/ai/comparar-schema";
import { deckSchema, type Deck } from "./deck-schema";

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
export const DECK_PROMPT_VERSAO = "deck-1.0.0";

function extrairJson(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  if (ini !== -1 && fim !== -1 && fim > ini) return t.slice(ini, fim + 1);
  return t;
}

// Princípios de design vindos da skill ppt-visual, destilados para o prompt.
const PROMPT_SISTEMA = `Você é um designer sênior de apresentações executivas para procurement/compras. Recebe o resultado de uma comparação de propostas comerciais e PROJETA uma apresentação de diretoria — você NÃO copia o texto de entrada, você INTERPRETA e CRIA o conteúdo dos slides.

Devolva SOMENTE um JSON no formato:
{
  "slides": [ {slide}, {slide}, ... ]
}

Tipos de slide disponíveis (campo "tipo"):

1) "capa": { "tipo":"capa", "titulo": "...", "subtitulo": "..." }
   - Título curto e forte da decisão. Subtítulo = 1 frase com o desfecho.

2) "destaques": { "tipo":"destaques", "titulo":"...", "metricas":[ {"valor":"R$ 171.677","rotulo":"Economia gerada"} ] }
   - 2 a 4 NÚMEROS de maior impacto extraídos da comparação (economia, desconto, alcance, valor). Um número, um rótulo curto. É o slide de impacto.

3) "recomendacao": { "tipo":"recomendacao", "titulo":"Recomendação", "headline":"frase de tese forte", "paragrafos":["...","..."] }
   - headline = a tese em 1 frase. paragrafos = 2 a 3 parágrafos CURTOS (máx ~2 linhas cada), escritos por você de forma escaneável. NÃO cole o texto original inteiro.

4) "tabela": { "tipo":"tabela", "titulo":"Comparativo lado a lado", "colunas":["Critério","Prop A","Prop B"], "linhas":[ {"celulas":[{"texto":"Valor"},{"texto":"R$ 110k","destaque":true},{"texto":"R$ 145k"}]} ] }
   - Escolha de 5 a 8 critérios que REALMENTE decidem (não todos). 1ª coluna = nome do critério; demais = uma por proposta, na MESMA ordem das colunas. Marque "destaque":true na célula vencedora de cada linha.

5) "grafico": { "tipo":"grafico", "titulo":"...", "tipo_grafico":"barra", "unidade":"R$", "series":[ {"rotulo":"Prop A","valor":110131},{"rotulo":"Prop B","valor":145648} ] }
   - Use SOMENTE se houver números comparáveis reais (ex: valores negociados, economia, alcance). valor = número puro (sem R$, sem pontos). Se não houver números comparáveis, NÃO inclua slide de gráfico.

6) "cenarios": { "tipo":"cenarios", "titulo":"Cenários de decisão", "itens":[ {"condicao":"o prazo é crítico","recomendado":"Prop A","porque":"..."} ] }

7) "proximos_passos": { "tipo":"proximos_passos", "titulo":"Próximos passos", "passos":["...","..."] }
   - 3 a 5 ações práticas que VOCÊ recomenda (negociar X, pedir Y, fechar até Z). Conteúdo novo, não estava na entrada.

REGRAS DE DESIGN (siga à risca):
- Uma ideia por slide. Mate o "paredão de texto" — prefira números, frases curtas, listas enxutas.
- Sequência recomendada: capa → destaques → recomendacao → tabela → grafico (se aplicável) → cenarios → proximos_passos. Pule os que não fizerem sentido.
- Hierarquia: o que importa primeiro, grande; detalhe depois, pequeno.
- Tudo em português do Brasil. Use os mesmos "ref"/nomes de proposta que vierem na entrada.
- Seja assertivo e específico com os dados reais da comparação. Nada de placeholder.
- Responda apenas o JSON. Sem comentários, sem texto fora do JSON.`;

export interface ResultadoDeck {
  deck: Deck;
  origem: "ia" | "fallback";
}

/**
 * Pede à IA para compor a apresentação a partir do comparativo.
 * Se a IA falhar (chave ausente, JSON inválido, formato errado), cai num deck
 * padrão montado a partir dos próprios dados — a exportação nunca quebra.
 */
export async function montarDeck(
  comparativo: Comparativo,
  empresa: string | null,
): Promise<ResultadoDeck> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { deck: deckPadrao(comparativo), origem: "fallback" };

  try {
    const client = new Anthropic({ apiKey });
    const mensagem = `Empresa que apresenta: ${empresa ?? "(não informada)"}

Resultado da comparação (JSON):
${JSON.stringify(comparativo)}`;

    const resposta = await client.messages.create({
      model: MODELO,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: PROMPT_SISTEMA,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: mensagem }],
    });

    const texto = resposta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const json = JSON.parse(extrairJson(texto));
    const parsed = deckSchema.safeParse(json);
    if (!parsed.success) {
      console.error(
        "[deck-plan] JSON da IA fora do schema, usando fallback:",
        parsed.error.issues.slice(0, 3),
      );
      return { deck: deckPadrao(comparativo), origem: "fallback" };
    }
    return { deck: parsed.data, origem: "ia" };
  } catch (erro) {
    console.error("[deck-plan] falha ao compor deck, usando fallback:", erro);
    return { deck: deckPadrao(comparativo), origem: "fallback" };
  }
}

/** Deck mínimo, mas correto, montado direto dos dados (rede de segurança). */
export function deckPadrao(comparativo: Comparativo): Deck {
  const { propostas, matriz, resumo, recomendacao, vencedor_ref, cenarios } =
    comparativo;

  const slides: Deck["slides"] = [
    {
      tipo: "capa",
      titulo: "Comparativo de propostas",
      subtitulo: resumo ?? `Recomendação: ${vencedor_ref}`,
    },
    {
      tipo: "recomendacao",
      titulo: "Recomendação",
      headline: resumo ?? `Recomendamos ${vencedor_ref}.`,
      paragrafos: recomendacao
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 4),
    },
    {
      tipo: "tabela",
      titulo: "Comparativo lado a lado",
      colunas: ["Critério", ...propostas.map((p) => p.ref)],
      linhas: matriz.slice(0, 9).map((linha) => ({
        celulas: [
          { texto: linha.criterio },
          ...propostas.map((p) => {
            const av = linha.avaliacoes.find((a) => a.ref === p.ref);
            return { texto: av?.valor ?? "—", destaque: !!av?.destaque };
          }),
        ],
      })),
    },
  ];

  // Gráfico de valores, se houver ao menos 2 valores numéricos.
  const comValor = propostas.filter(
    (p): p is typeof p & { valor_negociado: number } =>
      typeof p.valor_negociado === "number",
  );
  if (comValor.length >= 2) {
    slides.push({
      tipo: "grafico",
      titulo: "Valor negociado por proposta",
      tipo_grafico: "barra",
      unidade: "R$",
      series: comValor.map((p) => ({
        rotulo: p.ref,
        valor: p.valor_negociado,
      })),
    });
  }

  if (cenarios.length > 0) {
    slides.push({
      tipo: "cenarios",
      titulo: "Cenários de decisão",
      itens: cenarios.slice(0, 6).map((c) => ({
        condicao: c.se,
        recomendado: c.entao_ref,
        porque: c.porque,
      })),
    });
  }

  return { slides };
}
