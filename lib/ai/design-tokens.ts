import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export interface TokensDesign {
  cor_primaria: string | null;
  cor_secundaria: string | null;
}

function extrairJson(texto: string): string {
  const t = texto.trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  return ini !== -1 && fim !== -1 ? t.slice(ini, fim + 1) : t;
}

// Normaliza para #RRGGBB (expande #RGB). Retorna null se não for hex válido.
function normalizarHex(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  let v = valor.trim();
  if (/^#?[0-9a-fA-F]{3}$/.test(v)) {
    const h = v.replace("#", "");
    v = `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (!v.startsWith("#")) v = `#${v}`;
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : null;
}

/**
 * Lê o design system (markdown) da empresa e extrai as duas cores de marca.
 * Assertivo: escolhe as cores mais proeminentes; só retorna null se não houver
 * nenhuma cor no documento.
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
        text: `Você recebe a documentação de design de uma empresa e deve identificar as DUAS cores de marca mais importantes.

Retorne SOMENTE JSON: { "cor_primaria": "#RRGGBB" | null, "cor_secundaria": "#RRGGBB" | null }

- cor_primaria = a cor ESCURA/sóbria de marca (boa para FUNDO de capa). Se houver várias, escolha a mais escura/neutra.
- cor_secundaria = a cor de DESTAQUE/accent (a mais vibrante/saturada, usada em CTAs e realces).

REGRAS:
- Seja ASSERTIVO: praticamente todo design system tem cores. Escolha as mais proeminentes mesmo que não estejam rotuladas como "primary/accent".
- Aceite cores em qualquer notação (hex, rgb) e CONVERTA para #RRGGBB de 6 dígitos.
- Só use null se realmente NÃO houver nenhuma cor no documento.
- Não escreva nada além do JSON.`,
      },
    ],
    messages: [{ role: "user", content: markdown.slice(0, 30000) }],
  });

  const texto = resposta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let bruto: { cor_primaria?: unknown; cor_secundaria?: unknown } = {};
  try {
    bruto = JSON.parse(extrairJson(texto));
  } catch {
    bruto = {};
  }

  const tokens: TokensDesign = {
    cor_primaria: normalizarHex(bruto.cor_primaria),
    cor_secundaria: normalizarHex(bruto.cor_secundaria),
  };

  console.error(
    `[design-tokens] IA: ${texto.slice(0, 200)} | normalizado:`,
    tokens,
  );
  return tokens;
}
