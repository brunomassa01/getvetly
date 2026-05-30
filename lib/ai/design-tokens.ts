import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const tokensSchema = z.object({
  // Cor escura/principal da marca (usada em fundos de destaque). Hex ou null.
  cor_primaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
  // Cor de destaque/accent (usada em realces). Hex ou null.
  cor_secundaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});

export type TokensDesign = z.infer<typeof tokensSchema>;

function extrairJson(texto: string): string {
  const t = texto.trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  return ini !== -1 && fim !== -1 ? t.slice(ini, fim + 1) : t;
}

/**
 * Lê o design system (markdown) da empresa e extrai as cores principais.
 * Retorna null em cada cor que não for encontrada (mantém o padrão).
 */
export async function extrairTokensDesign(
  markdown: string,
): Promise<TokensDesign> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");
  const client = new Anthropic({ apiKey });

  const resposta = await client.messages.create({
    model: MODELO,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: `Você recebe o design system de uma empresa (markdown) e extrai as duas cores de marca.
Retorne SOMENTE JSON: { "cor_primaria": "#RRGGBB" | null, "cor_secundaria": "#RRGGBB" | null }
- cor_primaria: a cor ESCURA/principal da marca (boa para fundos). Se não houver clara, use null.
- cor_secundaria: a cor de DESTAQUE/accent (realces, CTAs). Se não houver, use null.
Use apenas cores que estejam explícitas no documento. Não invente.`,
      },
    ],
    messages: [{ role: "user", content: markdown.slice(0, 30000) }],
  });

  const texto = resposta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    const parsed = tokensSchema.safeParse(JSON.parse(extrairJson(texto)));
    return parsed.success
      ? parsed.data
      : { cor_primaria: null, cor_secundaria: null };
  } catch {
    return { cor_primaria: null, cor_secundaria: null };
  }
}
