import "server-only";
import pptxgen from "pptxgenjs";
import { formatarData } from "@/lib/format";
import type { Deck, Slide } from "./deck-schema";

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

// Altura estimada (in) de um texto, para empilhar blocos sem sobrepor.
function alturaTexto(texto: string, fontePt: number, larguraIn: number): number {
  const charsPorLinha = Math.max(
    10,
    Math.floor((larguraIn * 72) / (fontePt * 0.5)),
  );
  const linhas = texto
    .split("\n")
    .reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / charsPorLinha)), 0);
  return linhas * ((fontePt * 1.32) / 72);
}

const ehRisco = (v: string) => /risco/i.test(v);

export interface ContextoPptx {
  empresa: string | null;
  criadoEm?: string;
  eyebrow: string; // etiqueta no topo (ex: "COMPARATIVO DE PROPOSTAS")
  subinfo?: string; // sufixo da linha de meta (ex: "3 propostas")
  chips?: string[]; // pílulas (propostas comparadas); vazio = sem chips
  banda?: { rotulo: string; valor: string } | null; // faixa de destaque na base
  cores?: { fundo?: string | null; destaque?: string | null };
  logo?: { dataUrl: string; w: number; h: number } | null;
}

/** Renderiza o deck (já composto pela IA) em um .pptx editável. */
export async function gerarPptxComparativo(
  deck: Deck,
  ctx: ContextoPptx,
): Promise<Buffer> {
  const INK = hexLimpo(ctx.cores?.fundo, "#1E1E1E");
  const LIME = hexLimpo(ctx.cores?.destaque, "#C8FF02");
  const FAINT = clarear(LIME, 0.82);
  const SUB_INK = clarear(INK, 0.6);

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.author = "Vetly";
  pptx.company = ctx.empresa ?? "Vetly";

  // Título de seção com barra de destaque (igual à tela).
  const tituloSecao = (slide: pptxgen.Slide, texto: string) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7,
      y: 0.5,
      w: 0.13,
      h: 0.44,
      fill: { color: LIME },
      rectRadius: 0.06,
    });
    slide.addText(texto, {
      x: 0.98,
      y: 0.4,
      w: 11.6,
      h: 0.64,
      fontFace: "Arial",
      fontSize: 24,
      bold: true,
      color: INK,
    });
  };

  // ===== Capa =====
  const renderCapa = (s: Extract<Slide, { tipo: "capa" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: INK };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.12,
      fill: { color: LIME },
    });

    // Logo com proporção preservada (ou nome da empresa)
    if (ctx.logo) {
      let h = 0.62;
      let w = h * (ctx.logo.w / ctx.logo.h);
      if (w > 3.0) {
        w = 3.0;
        h = w * (ctx.logo.h / ctx.logo.w);
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.7,
        y: 0.55,
        w: w + 0.3,
        h: h + 0.22,
        fill: { color: "FFFFFF" },
        rectRadius: 0.08,
      });
      slide.addImage({
        data: ctx.logo.dataUrl,
        x: 0.85,
        y: 0.66,
        w,
        h,
      });
    } else if (ctx.empresa) {
      slide.addText(ctx.empresa.toUpperCase(), {
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

    slide.addText(ctx.eyebrow, {
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

    slide.addText(s.titulo, {
      x: 0.66,
      y: 2.3,
      w: 12,
      h: 1.3,
      fontFace: "Arial",
      fontSize: 40,
      bold: true,
      color: PAPER,
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.72,
      y: 3.62,
      w: 1.1,
      h: 0.07,
      fill: { color: LIME },
      rectRadius: 0.035,
    });
    if (s.subtitulo) {
      slide.addText(s.subtitulo, {
        x: 0.7,
        y: 3.82,
        w: 11.4,
        h: 0.7,
        fontFace: "Arial",
        fontSize: 15,
        color: clarear(INK, 0.82),
        valign: "top",
      });
    }
    const meta = [
      ctx.empresa,
      ctx.criadoEm ? formatarData(ctx.criadoEm) : null,
      ctx.subinfo,
    ]
      .filter(Boolean)
      .join("  ·  ");
    slide.addText(meta, {
      x: 0.7,
      y: 4.55,
      w: 12,
      h: 0.35,
      fontFace: "Arial",
      fontSize: 12,
      color: SUB_INK,
    });

    // Chips (opcional)
    let cx = 0.7;
    for (const ref of ctx.chips ?? []) {
      const w = Math.min(4, 0.5 + ref.length * 0.085);
      if (cx + w > 12.6) break;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: 5.0,
        w,
        h: 0.42,
        fill: { color: INK },
        line: { color: LIME, width: 0.75 },
        rectRadius: 0.21,
      });
      slide.addText(ref, {
        x: cx,
        y: 5.0,
        w,
        h: 0.42,
        fontFace: "Arial",
        fontSize: 10,
        color: PAPER,
        align: "center",
        valign: "middle",
      });
      cx += w + 0.2;
    }

    // Faixa de destaque na base (opcional)
    if (ctx.banda) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.7,
        y: 5.7,
        w: 7,
        h: 1.2,
        fill: { color: LIME },
        rectRadius: 0.12,
      });
      slide.addText(
        [
          {
            text: `${ctx.banda.rotulo.toUpperCase()}\n`,
            options: { fontSize: 11, color: INK, charSpacing: 2 },
          },
          {
            text: ctx.banda.valor,
            options: { fontSize: 26, bold: true, color: INK },
          },
        ],
        { x: 0.95, y: 5.82, w: 6.5, h: 0.95, fontFace: "Arial", valign: "middle" },
      );
    }
  };

  // ===== Destaques (números) =====
  const renderDestaques = (s: Extract<Slide, { tipo: "destaques" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    const n = s.metricas.length;
    const gap = 0.35;
    const cardW = (11.9 - (n - 1) * gap) / n;
    const cardH = 2.7;
    const y = 2.2;
    const fonteValor = n >= 4 ? 30 : n === 3 ? 34 : 40;

    s.metricas.forEach((m, i) => {
      const x = 0.7 + i * (cardW + gap);
      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: cardW,
        h: cardH,
        fill: { color: FAINT },
        rectRadius: 0.12,
      });
      slide.addText(m.valor, {
        x: x + 0.15,
        y: y + 0.45,
        w: cardW - 0.3,
        h: 1.1,
        fontFace: "Arial",
        fontSize: fonteValor,
        bold: true,
        color: INK,
        align: "center",
        valign: "middle",
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: x + cardW / 2 - 0.35,
        y: y + 1.6,
        w: 0.7,
        h: 0.05,
        fill: { color: LIME },
      });
      slide.addText(m.rotulo, {
        x: x + 0.2,
        y: y + 1.78,
        w: cardW - 0.4,
        h: 0.75,
        fontFace: "Arial",
        fontSize: 13,
        color: TEXTO2,
        align: "center",
        valign: "top",
      });
    });
  };

  // ===== Recomendação (narrativa) =====
  const renderRecomendacao = (s: Extract<Slide, { tipo: "recomendacao" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    let y = 1.45;
    const hHead = Math.max(0.6, alturaTexto(s.headline, 20, 11.0) + 0.15);
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y,
      w: 0.06,
      h: hHead,
      fill: { color: LIME },
    });
    slide.addText(s.headline, {
      x: 0.95,
      y,
      w: 11.2,
      h: hHead,
      fontFace: "Arial",
      fontSize: 20,
      bold: true,
      color: INK,
      valign: "top",
      lineSpacingMultiple: 1.08,
    });
    y += hHead + 0.35;

    for (const p of s.paragrafos) {
      const h = alturaTexto(p, 13, 11.6) + 0.1;
      if (y + h > 7.2) break;
      slide.addText(p, {
        x: 0.7,
        y,
        w: 11.9,
        h,
        fontFace: "Arial",
        fontSize: 13,
        color: TEXTO2,
        valign: "top",
        lineSpacingMultiple: 1.25,
      });
      y += h + 0.18;
    }
  };

  // ===== Tabela =====
  const renderTabela = (s: Extract<Slide, { tipo: "tabela" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    const header: pptxgen.TableRow = s.colunas.map((col, i) => ({
      text: i === 0 ? col.toUpperCase() : col,
      options: {
        bold: true,
        color: i === 0 ? clarear(INK, 0.6) : PAPER,
        fill: { color: INK },
      },
    }));
    const linhas: pptxgen.TableRow[] = s.linhas.map((linha) =>
      linha.celulas.map((c, i) => ({
        text: (c.destaque ? "✓ " : "") + c.texto,
        options: {
          bold: i === 0 || !!c.destaque,
          color: c.destaque ? INK : ehRisco(c.texto) ? DANGER : INK,
          fill: { color: c.destaque ? FAINT : "FFFFFF" },
        },
      })),
    );

    slide.addTable([header, ...linhas], {
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
  };

  // ===== Gráfico =====
  const renderGrafico = (s: Extract<Slide, { tipo: "grafico" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    const dados = [
      {
        name: s.titulo,
        labels: s.series.map((p) => p.rotulo),
        values: s.series.map((p) => p.valor),
      },
    ];
    slide.addChart(
      s.tipo_grafico === "barra_horizontal"
        ? pptx.ChartType.bar
        : pptx.ChartType.bar,
      dados,
      {
        x: 0.9,
        y: 1.5,
        w: 11.5,
        h: 5.3,
        barDir: s.tipo_grafico === "barra_horizontal" ? "bar" : "col",
        chartColors: [LIME],
        showLegend: false,
        showTitle: false,
        showValue: true,
        dataLabelColor: INK,
        dataLabelFontFace: "Arial",
        dataLabelFontSize: 11,
        dataLabelFontBold: true,
        catAxisLabelColor: INK,
        catAxisLabelFontFace: "Arial",
        catAxisLabelFontSize: 11,
        valAxisHidden: true,
        valGridLine: { style: "none" },
        showCatAxisTitle: false,
      },
    );
  };

  // ===== Cenários (cards numerados) =====
  const renderCenarios = (s: Extract<Slide, { tipo: "cenarios" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    const colW = 5.78;
    const cardH = 1.78;
    const gapX = 0.34;
    const gapY = 0.28;

    s.itens.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.7 + col * (colW + gapX);
      const y = 1.3 + row * (cardH + gapY);
      if (y + cardH > 7.45) return;

      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: colW,
        h: cardH,
        fill: { color: "FFFFFF" },
        line: { color: BORDA, width: 1 },
        rectRadius: 0.08,
      });
      slide.addShape(pptx.ShapeType.rect, {
        x,
        y: y + 0.06,
        w: 0.08,
        h: cardH - 0.12,
        fill: { color: LIME },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x + 0.28,
        y: y + 0.24,
        w: 0.38,
        h: 0.38,
        fill: { color: LIME },
      });
      slide.addText(String(i + 1), {
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
      slide.addText(c.recomendado, {
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
      slide.addText(
        [
          { text: "Se ", options: { bold: true, color: INK, fontSize: 11 } },
          { text: `${c.condicao}\n`, options: { color: INK, fontSize: 11 } },
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
  };

  // ===== Próximos passos =====
  const renderPassos = (s: Extract<Slide, { tipo: "proximos_passos" }>) => {
    const slide = pptx.addSlide();
    slide.background = { color: PAPER };
    tituloSecao(slide, s.titulo);

    let y = 1.5;
    s.passos.forEach((passo, i) => {
      const h = Math.max(0.5, alturaTexto(passo, 14, 10.8) + 0.2);
      if (y + h > 7.2) return;
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.7,
        y: y + 0.04,
        w: 0.42,
        h: 0.42,
        fill: { color: LIME },
      });
      slide.addText(String(i + 1), {
        x: 0.7,
        y: y + 0.04,
        w: 0.42,
        h: 0.42,
        fontFace: "Arial",
        fontSize: 14,
        bold: true,
        color: INK,
        align: "center",
        valign: "middle",
      });
      slide.addText(passo, {
        x: 1.3,
        y,
        w: 11.0,
        h,
        fontFace: "Arial",
        fontSize: 14,
        color: TEXTO2,
        valign: "top",
        lineSpacingMultiple: 1.2,
      });
      y += h + 0.25;
    });
  };

  for (const s of deck.slides) {
    switch (s.tipo) {
      case "capa":
        renderCapa(s);
        break;
      case "destaques":
        renderDestaques(s);
        break;
      case "recomendacao":
        renderRecomendacao(s);
        break;
      case "tabela":
        renderTabela(s);
        break;
      case "grafico":
        renderGrafico(s);
        break;
      case "cenarios":
        renderCenarios(s);
        break;
      case "proximos_passos":
        renderPassos(s);
        break;
    }
  }

  const dados = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return dados;
}
