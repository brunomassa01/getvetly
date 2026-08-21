import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  COMPARAR_PROMPT_SISTEMA,
  COMPARAR_PROMPT_VERSAO,
} from "./comparar-prompt";
import { comparativoSchema, type Comparativo } from "./comparar-schema";
import type { Analise } from "./schema";

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

export interface ResultadoComparativo {
  comparativo: Comparativo;
  tokensInput: number;
  tokensOutput: number;
  custoUsd: number;
  latenciaMs: number;
  modelo: string;
  promptVersao: string;
}

export async function compararPropostas(input: {
  criterios: string;
  propostas: { ref: string; analise: Analise }[];
}): Promise<ResultadoComparativo> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no servidor.");

  const client = new Anthropic({ apiKey });

  const blocos = input.propostas
    .map(
      (p) =>
        `### Proposta ref="${p.ref}"\n${JSON.stringify(p.analise)}`,
    )
    .join("\n\n");

  const mensagemUsuario = `Critério de decisão do comprador: ${
    input.criterios.trim() || "(não informado — use bom senso de procurement)"
  }

Propostas já analisadas (JSON de cada análise). Use os refs indicados:
${blocos}`;

  const inicio = Date.now();
  // Streaming + 32k tokens: comparações com muitas propostas estouravam o
  // limite antigo de 8k e o JSON chegava cortado (stop_reason=max_tokens).
  const resposta = await client.messages
    .stream({
      model: MODELO,
      max_tokens: 32000,
      system: [
        {
          type: "text",
          text: COMPARAR_PROMPT_SISTEMA,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: mensagemUsuario }],
    })
    .finalMessage();
  const latenciaMs = Date.now() - inicio;

  const texto = resposta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let json: unknown;
  try {
    json = JSON.parse(extrairJson(texto));
  } catch {
    console.error(
      `[comparar] JSON inválido. stop_reason=${resposta.stop_reason}. Prévia:`,
      texto.slice(0, 300),
    );
    throw new Error(
      resposta.stop_reason === "max_tokens"
        ? "A resposta da IA foi cortada (muitas propostas)."
        : "A IA retornou um JSON inválido na comparação.",
    );
  }

  const parsed = comparativoSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("A comparação da IA não seguiu o formato esperado.");
  }

  const tokensInput = resposta.usage.input_tokens;
  const tokensOutput = resposta.usage.output_tokens;
  const custoUsd = (tokensInput * 3 + tokensOutput * 15) / 1_000_000;

  return {
    comparativo: parsed.data,
    tokensInput,
    tokensOutput,
    custoUsd,
    latenciaMs,
    modelo: MODELO,
    promptVersao: COMPARAR_PROMPT_VERSAO,
  };
}
