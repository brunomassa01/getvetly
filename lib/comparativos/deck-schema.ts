import { z } from "zod";

/**
 * Plano de apresentação ("deck") que a IA compõe a partir do comparativo.
 * Cada slide é tipado — o renderizador (pptx.ts) sabe desenhar cada tipo com
 * layout próprio. A IA decide QUAIS slides existem, a ordem e a copy de cada um.
 */

const metricaSchema = z.object({
  valor: z.string(), // ex: "R$ 171.677", "54%", "1,95 mi"
  rotulo: z.string(), // ex: "Economia gerada"
});

const celulaSchema = z.object({
  texto: z.string(),
  destaque: z.boolean().optional(), // realça a célula vencedora
});

// --- Slides ---

const slideCapa = z.object({
  tipo: z.literal("capa"),
  titulo: z.string(),
  subtitulo: z.string().optional(),
});

// Números de destaque ("um número por slide" — impacto executivo).
const slideDestaques = z.object({
  tipo: z.literal("destaques"),
  titulo: z.string(),
  metricas: z.array(metricaSchema).min(1).max(4),
});

// Recomendação narrativa: headline forte + parágrafos curtos (não um blocão).
const slideRecomendacao = z.object({
  tipo: z.literal("recomendacao"),
  titulo: z.string(),
  headline: z.string(),
  paragrafos: z.array(z.string()).max(4).default([]),
});

// Tabela comparativa enxuta — a IA escolhe os critérios que decidem.
const slideTabela = z.object({
  tipo: z.literal("tabela"),
  titulo: z.string(),
  colunas: z.array(z.string()).min(2),
  linhas: z.array(z.object({ celulas: z.array(celulaSchema) })).max(9),
});

// Gráfico de barras — só quando há números comparáveis (ex: valores).
const slideGrafico = z.object({
  tipo: z.literal("grafico"),
  titulo: z.string(),
  tipo_grafico: z.enum(["barra", "barra_horizontal"]).default("barra"),
  unidade: z.string().optional(), // "R$", "%"
  series: z.array(z.object({ rotulo: z.string(), valor: z.number() })).min(2),
});

// Cenários condicionais ("se prazo é crítico → X").
const slideCenarios = z.object({
  tipo: z.literal("cenarios"),
  titulo: z.string(),
  itens: z
    .array(
      z.object({
        condicao: z.string(),
        recomendado: z.string(),
        porque: z.string(),
      }),
    )
    .max(6),
});

// Próximos passos — conteúdo NOVO que a IA gera (não vem do comparativo).
const slidePassos = z.object({
  tipo: z.literal("proximos_passos"),
  titulo: z.string(),
  passos: z.array(z.string()).min(1).max(6),
});

export const slideSchema = z.discriminatedUnion("tipo", [
  slideCapa,
  slideDestaques,
  slideRecomendacao,
  slideTabela,
  slideGrafico,
  slideCenarios,
  slidePassos,
]);

export const deckSchema = z.object({
  slides: z.array(slideSchema).min(3),
});

export type Deck = z.infer<typeof deckSchema>;
export type Slide = z.infer<typeof slideSchema>;
