import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_SISTEMA, PROMPT_VERSAO } from "./prompt";
import { analiseSchema, type Analise } from "./schema";

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

// Extrai o objeto JSON da resposta: remove cercas de markdown e recorta do
// primeiro "{" ao último "}". Robusto contra texto antes/depois do JSON.
function extrairJson(texto: string): string {
  let t = texto.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  if (ini !== -1 && fim !== -1 && fim > ini) {
    return t.slice(ini, fim + 1);
  }
  return t;
}

export interface ResultadoAnalise {
  analise: Analise;
  tokensInput: number;
  tokensOutput: number;
  custoUsd: number;
  latenciaMs: number;
  modelo: string;
  promptVersao: string;
}

export async function analisarProposta(input: {
  contexto: string;
  titulo: string;
  categoria: string;
  escopo: string | null;
}): Promise<ResultadoAnalise> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");

  const client = new Anthropic({ apiKey });

  const mensagemUsuario = `Contexto informado pelo comprador:
- Título: ${input.titulo}
- Categoria: ${input.categoria}
- Escopo: ${input.escopo ?? "(não informado)"}

Conteúdo extraído dos arquivos da proposta:
${input.contexto}`;

  const inicio = Date.now();
  const resposta = await client.messages.create({
    model: MODELO,
    max_tokens: 8192,
    // O prompt de sistema é reaproveitado em toda análise → cacheado.
    system: [
      {
        type: "text",
        text: PROMPT_SISTEMA,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      { role: "user", content: mensagemUsuario },
      // Prefill: força a resposta a começar já no JSON, sem texto antes.
      { role: "assistant", content: "{" },
    ],
  });
  const latenciaMs = Date.now() - inicio;

  const continuacao = resposta.content
    .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("");
  // Reanexa o "{" do prefill e recorta o objeto JSON.
  const textoCompleto = "{" + continuacao;

  let json: unknown;
  try {
    json = JSON.parse(extrairJson(textoCompleto));
  } catch {
    console.error(
      `[analise] JSON inválido. stop_reason=${resposta.stop_reason}. Prévia:`,
      textoCompleto.slice(0, 300),
    );
    throw new Error(
      resposta.stop_reason === "max_tokens"
        ? "A resposta da IA foi cortada (proposta muito longa)."
        : "A IA retornou um JSON inválido.",
    );
  }

  const parsed = analiseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("A análise da IA não seguiu o formato esperado.");
  }

  const tokensInput = resposta.usage.input_tokens;
  const tokensOutput = resposta.usage.output_tokens;
  // Claude Sonnet: ~US$3/M tokens input, US$15/M tokens output.
  const custoUsd = (tokensInput * 3 + tokensOutput * 15) / 1_000_000;

  return {
    analise: parsed.data,
    tokensInput,
    tokensOutput,
    custoUsd,
    latenciaMs,
    modelo: MODELO,
    promptVersao: PROMPT_VERSAO,
  };
}
