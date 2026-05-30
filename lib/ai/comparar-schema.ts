import { z } from "zod";

// Resultado da comparação entre propostas (US-021).
export const comparativoSchema = z.object({
  // Propostas comparadas, com um "ref" curto usado nas colunas da matriz.
  propostas: z.array(
    z.object({
      ref: z.string(), // ex: "Eletromidia" ou "Proposta A"
      fornecedor: z.string().nullable(),
      valor_negociado: z.number().nullable(),
    }),
  ),
  // Matriz: cada linha é um critério; cada proposta recebe uma avaliação.
  matriz: z.array(
    z.object({
      criterio: z.string(),
      avaliacoes: z.array(
        z.object({
          ref: z.string(),
          valor: z.string(), // texto curto (ex: "R$ 110k", "28 dias", "Alta")
          destaque: z.boolean(), // true = melhor nesta linha
        }),
      ),
      vencedor_ref: z.string().nullable(),
    }),
  ),
  // Headline curta (1-2 frases) — exibida em destaque.
  resumo: z.string().optional(),
  // Recomendação final alinhada ao critério do usuário (parágrafos curtos).
  recomendacao: z.string(),
  vencedor_ref: z.string(),
  // Cenários condicionais ("se prazo crítico → X").
  cenarios: z.array(
    z.object({
      se: z.string(),
      entao_ref: z.string(),
      porque: z.string(),
    }),
  ),
});

export type Comparativo = z.infer<typeof comparativoSchema>;
