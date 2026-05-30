import "server-only";
import pptxgen from "pptxgenjs";
import type { Comparativo } from "@/lib/ai/comparar-schema";
import { formatarData } from "@/lib/format";

const PAPER = "FAFAF7";
const TEXTO2 = "4A4A48";
const TEXTO3 = "85827A";
const DANGER = "E24B4A";
const BORDA = "E6E4DD";

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

interface ExtrasPptx {
  criadoEm?: string;
  logoDataUrl?: string | null;
}

/** Gera um .pptx editável a partir do comparativo. Retorna um Buffer. */
export async function gerarPptxComparativo(
  comparativo: Comparativo,
  titulo: string,
  empresa: string | null,
  cores?: { fundo?: string | null; destaque?: string | null },
  extras?: ExtrasPptx,
): Promise<Buffer> {
  const { propostas, matriz, resumo, recomendacao, vencedor_ref, cenarios } =
    comparativo;

  // Cores da identidade da empresa (fallback: ink + lime da Vetly).
  const INK = hexLimpo(cores?.fundo, "#1E1E1E");
  const LIME = hexLimpo(cores?.destaque, "#C8FF02");
  const FAINT = clarear(LIME, 0.82); // tom claro do destaque (célula/realce)
  const SUB_INK = clarear(INK, 0.55); // texto suave sobre o fundo escuro

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.author = "Vetly";
  pptx.company = empresa ?? "Vetly";

  // Título de seção com barra de destaque (espelha a tela).
  const tituloSecao = (slide: pptxgen.Slide, texto: string) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7,
      y: 0.52,
      w: 0.13,
      h: 0.44,
      fill: { color: LIME },
      rectRadius: 0.06,
    });
    slide.addText(texto, {
      x: 0.98,
      y: 0.42,
      w: 11,
      h: 0.64,
      fontFace: "Arial",
      fontSize: 24,
      bold: true,
      color: INK,
    });
  };

  // ===== Slide 1: Capa =====
  const capa = pptx.addSlide();
  capa.background = { color: INK };

  // Faixa de destaque no topo
  capa.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.12,
    fill: { color: LIME },
  });

  // Logo (raster) com fundo branco arredondado, ou nome da empresa como rótulo
  if (extras?.logoDataUrl) {
    capa.addShape(pptx.ShapeType.roundRect, {
      x: 0.7,
      y: 0.55,
      w: 2.4,
      h: 0.7,
      fill: { color: "FFFFFF" },
      rectRadius: 0.08,
    });
    capa.addImage({
      data: extras.logoDataUrl,
      x: 0.85,
      y: 0.66,
      w: 2.1,
      h: 0.48,
      sizing: { type: "contain", w: 2.1, h: 0.48 },
    });
  } else if (empresa) {
    capa.addText(empresa.toUpperCase(), {
      x: 0.7,
      y: 0.62,
      w: 6,
      h: 0.5,
      fontFace: "Arial",
      fontSize: 14,
      bold: true,
      color: PAPER,
      charSpacing: 1,
    });
  }

  // Etiqueta superior direita
  capa.addText("COMPARATIVO DE PROPOSTAS", {
    x: 6.33,
    y: 0.68,
    w: 6.3,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 11,
    color: LIME,
    charSpacing: 2,
    align: "right",
  });

  // Título grande
  capa.addText(titulo, {
    x: 0.66,
    y: 2.5,
    w: 12,
    h: 1.5,
    fontFace: "Arial",
    fontSize: 40,
    bold: true,
    color: PAPER,
  });

  // Divisor de destaque
  capa.addShape(pptx.ShapeType.roundRect, {
    x: 0.72,
    y: 3.95,
    w: 1.1,
    h: 0.07,
    fill: { color: LIME },
    rectRadius: 0.035,
  });

  // Subtítulo: empresa · data · N propostas
  const partesSub = [
    empresa,
    extras?.criadoEm ? formatarData(extras.criadoEm) : null,
    `${propostas.length} propostas`,
  ].filter(Boolean);
  capa.addText(partesSub.join("  ·  "), {
    x: 0.7,
    y: 4.18,
    w: 12,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 13,
    color: SUB_INK,
  });

  // Chips das propostas comparadas (uma linha, com contorno de destaque)
  let cx = 0.7;
  const chipY = 4.7;
  const chipH = 0.42;
  for (const p of propostas) {
    const w = Math.min(4, 0.5 + p.ref.length * 0.085);
    if (cx + w > 12.6) break;
    capa.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: chipY,
      w,
      h: chipH,
      fill: { color: INK }, // mesma cor do fundo: só o contorno aparece
      line: { color: LIME, width: 0.75 },
      rectRadius: chipH / 2,
    });
    capa.addText(p.ref, {
      x: cx,
      y: chipY,
      w,
      h: chipH,
      fontFace: "Arial",
      fontSize: 10,
      color: PAPER,
      align: "center",
      valign: "middle",
    });
    cx += w + 0.2;
  }

  // Faixa do vencedor
  capa.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 5.5,
    w: 7,
    h: 1.3,
    fill: { color: LIME },
    rectRadius: 0.12,
  });
  capa.addText(
    [
      {
        text: "RECOMENDAÇÃO\n",
        options: { fontSize: 11, color: INK, charSpacing: 2 },
      },
      { text: vencedor_ref, options: { fontSize: 26, bold: true, color: INK } },
    ],
    { x: 0.95, y: 5.65, w: 6.5, h: 1.0, fontFace: "Arial", valign: "middle" },
  );

  // ===== Slide 2: Recomendação =====
  const rec = pptx.addSlide();
  rec.background = { color: PAPER };
  tituloSecao(rec, "Recomendação");

  let yRec = 1.4;
  if (resumo) {
    // Borda lateral de destaque + texto do resumo
    rec.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y: yRec,
      w: 0.06,
      h: 1.1,
      fill: { color: LIME },
    });
    rec.addText(resumo, {
      x: 0.95,
      y: yRec,
      w: 11.4,
      h: 1.1,
      fontFace: "Arial",
      fontSize: 18,
      bold: true,
      color: INK,
      valign: "top",
      lineSpacingMultiple: 1.1,
    });
    yRec += 1.35;
  }
  rec.addText(recomendacao, {
    x: 0.7,
    y: yRec,
    w: 11.9,
    h: 6.8 - yRec,
    fontFace: "Arial",
    fontSize: 12,
    color: TEXTO2,
    lineSpacingMultiple: 1.25,
    valign: "top",
  });

  // ===== Slide 3: Matriz =====
  const mat = pptx.addSlide();
  mat.background = { color: PAPER };
  tituloSecao(mat, "Comparativo lado a lado");

  const header: pptxgen.TableRow = [
    {
      text: "CRITÉRIO",
      options: { bold: true, color: clarear(INK, 0.6), fill: { color: INK } },
    },
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
          fill: { color: venc ? FAINT : "FFFFFF" },
          bold: venc,
        },
      };
    }),
  ]);

  mat.addTable([header, ...linhas], {
    x: 0.7,
    y: 1.25,
    w: 11.9,
    fontFace: "Arial",
    fontSize: 10,
    border: { type: "solid", pt: 0.5, color: BORDA },
    valign: "middle",
    autoPage: true,
    autoPageRepeatHeader: true,
  });

  // ===== Slide 4: Cenários (cards numerados) =====
  if (cenarios.length > 0) {
    const cen = pptx.addSlide();
    cen.background = { color: PAPER };
    tituloSecao(cen, "Cenários de decisão");

    const colW = 5.78;
    const cardH = 1.78;
    const gapX = 0.34;
    const gapY = 0.28;
    const x0 = 0.7;
    const y0 = 1.3;

    cenarios.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = x0 + col * (colW + gapX);
      const y = y0 + row * (cardH + gapY);
      if (y + cardH > 7.45) return; // não estoura o slide

      // Card base
      cen.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: colW,
        h: cardH,
        fill: { color: "FFFFFF" },
        line: { color: BORDA, width: 1 },
        rectRadius: 0.08,
      });
      // Borda lateral de destaque
      cen.addShape(pptx.ShapeType.rect, {
        x,
        y: y + 0.06,
        w: 0.08,
        h: cardH - 0.12,
        fill: { color: LIME },
      });
      // Círculo numerado
      cen.addShape(pptx.ShapeType.ellipse, {
        x: x + 0.28,
        y: y + 0.24,
        w: 0.38,
        h: 0.38,
        fill: { color: LIME },
      });
      cen.addText(String(i + 1), {
        x: x + 0.28,
        y: y + 0.24,
        w: 0.38,
        h: 0.38,
        fontFace: "Arial",
        fontSize: 13,
        bold: true,
        color: INK,
        align: "center",
        valign: "middle",
      });
      // Proposta vencedora do cenário
      cen.addText(c.entao_ref, {
        x: x + 0.78,
        y: y + 0.24,
        w: colW - 1.0,
        h: 0.4,
        fontFace: "Arial",
        fontSize: 13,
        bold: true,
        color: INK,
        valign: "middle",
      });
      // "Se ..." + porquê
      cen.addText(
        [
          { text: "Se ", options: { bold: true, color: INK, fontSize: 11 } },
          { text: `${c.se}\n`, options: { color: INK, fontSize: 11 } },
          {
            text: c.porque,
            options: { color: TEXTO3, fontSize: 10, paraSpaceBefore: 4 },
          },
        ],
        {
          x: x + 0.28,
          y: y + 0.74,
          w: colW - 0.5,
          h: cardH - 0.86,
          fontFace: "Arial",
          valign: "top",
          lineSpacingMultiple: 1.1,
        },
      );
    });
  }

  const dados = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return dados;
}
