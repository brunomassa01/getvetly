import "server-only";
import pptxgen from "pptxgenjs";
import type { Comparativo } from "@/lib/ai/comparar-schema";

const PAPER = "FAFAF7";
const TEXTO2 = "4A4A48";
const TEXTO3 = "85827A";
const DANGER = "E24B4A";

const hexLimpo = (cor: string | null | undefined, padrao: string): string =>
  (cor ?? padrao).replace("#", "").toUpperCase();

// Clareia um hex misturando com branco (fator 0..1; maior = mais claro).
function clarear(hex: string, fator: number): string {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * fator);
  return [mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** Gera um .pptx editável a partir do comparativo. Retorna um Buffer. */
export async function gerarPptxComparativo(
  comparativo: Comparativo,
  titulo: string,
  empresa: string | null,
  cores?: { fundo?: string | null; destaque?: string | null },
): Promise<Buffer> {
  const { propostas, matriz, resumo, recomendacao, vencedor_ref, cenarios } =
    comparativo;

  // Cores da identidade da empresa (fallback: ink + lime da Vetly).
  const INK = hexLimpo(cores?.fundo, "#1E1E1E");
  const LIME = hexLimpo(cores?.destaque, "#C8FF02");
  const LIME_FAINT = clarear(LIME, 0.82); // tom claro do destaque (célula vencedora)

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.author = "Vetly";
  pptx.company = empresa ?? "Vetly";

  // ===== Slide 1: Capa =====
  const capa = pptx.addSlide();
  capa.background = { color: INK };
  capa.addText("COMPARATIVO DE PROPOSTAS", {
    x: 0.7,
    y: 0.7,
    w: 12,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 12,
    color: LIME,
    charSpacing: 2,
  });
  capa.addText(titulo, {
    x: 0.7,
    y: 1.5,
    w: 12,
    h: 1.6,
    fontFace: "Arial",
    fontSize: 40,
    bold: true,
    color: PAPER,
  });
  if (empresa) {
    capa.addText(empresa, {
      x: 0.7,
      y: 3.1,
      w: 12,
      h: 0.4,
      fontSize: 14,
      color: "AAAAAA",
    });
  }
  // Caixa do vencedor
  capa.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 4.2,
    w: 6,
    h: 1.5,
    fill: { color: LIME },
    rectRadius: 0.15,
  });
  capa.addText(
    [
      { text: "RECOMENDAÇÃO\n", options: { fontSize: 11, color: INK, charSpacing: 2 } },
      { text: vencedor_ref, options: { fontSize: 26, bold: true, color: INK } },
    ],
    { x: 0.95, y: 4.35, w: 5.5, h: 1.2, fontFace: "Arial", valign: "middle" },
  );

  // ===== Slide 2: Recomendação =====
  const rec = pptx.addSlide();
  rec.background = { color: PAPER };
  rec.addText("Recomendação", {
    x: 0.7,
    y: 0.5,
    w: 12,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: INK,
  });
  if (resumo) {
    rec.addText(resumo, {
      x: 0.7,
      y: 1.3,
      w: 12,
      h: 1.2,
      fontSize: 18,
      bold: true,
      color: INK,
    });
  }
  rec.addText(recomendacao, {
    x: 0.7,
    y: resumo ? 2.6 : 1.3,
    w: 12,
    h: 4.2,
    fontSize: 12,
    color: TEXTO2,
    lineSpacingMultiple: 1.2,
    valign: "top",
  });

  // ===== Slide 3: Matriz =====
  const mat = pptx.addSlide();
  mat.background = { color: PAPER };
  mat.addText("Comparativo lado a lado", {
    x: 0.7,
    y: 0.4,
    w: 12,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: INK,
  });

  const header: pptxgen.TableRow = [
    { text: "Critério", options: { bold: true, color: PAPER, fill: { color: INK } } },
    ...propostas.map((p) => ({
      text: p.fornecedor ? `${p.ref}\n${p.fornecedor}` : p.ref,
      options: { bold: true, color: PAPER, fill: { color: INK } },
    })),
  ];
  const linhas: pptxgen.TableRow[] = matriz.map((linha) => [
    { text: linha.criterio, options: { bold: true, color: INK } },
    ...propostas.map((p) => {
      const av = linha.avaliacoes.find((a) => a.ref === p.ref);
      const venc = !!av?.destaque;
      const valor = av?.valor ?? "—";
      const ehRisco = /risco/i.test(valor);
      return {
        text: (venc ? "✓ " : "") + valor,
        options: {
          color: venc ? INK : ehRisco ? DANGER : INK,
          fill: { color: venc ? LIME_FAINT : "FFFFFF" },
          bold: venc,
        },
      };
    }),
  ]);

  mat.addTable([header, ...linhas], {
    x: 0.7,
    y: 1.2,
    w: 12,
    fontFace: "Arial",
    fontSize: 10,
    border: { type: "solid", pt: 0.5, color: "DDDDDD" },
    valign: "middle",
    autoPage: true,
    autoPageRepeatHeader: true,
  });

  // ===== Slide 4: Cenários =====
  if (cenarios.length > 0) {
    const cen = pptx.addSlide();
    cen.background = { color: PAPER };
    cen.addText("Cenários de decisão", {
      x: 0.7,
      y: 0.5,
      w: 12,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: INK,
    });
    const texto = cenarios.flatMap((c) => [
      {
        text: `Se ${c.se}  →  ${c.entao_ref}`,
        options: { bold: true, fontSize: 14, color: INK, bullet: true, paraSpaceBefore: 8 },
      },
      {
        text: c.porque,
        options: { fontSize: 11, color: TEXTO3, indentLevel: 1, paraSpaceAfter: 6 },
      },
    ]);
    cen.addText(texto, {
      x: 0.7,
      y: 1.3,
      w: 12,
      h: 5.5,
      fontFace: "Arial",
      valign: "top",
    });
  }

  const dados = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return dados;
}
