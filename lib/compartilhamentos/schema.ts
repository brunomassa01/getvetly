import { z } from "zod";

// Tipos de conteúdo que podem ser compartilhados por link.
export const TIPOS_ALVO = ["proposta", "comparativo"] as const;
export type TipoAlvo = (typeof TIPOS_ALVO)[number];

// Decisões do revisor externo (espelha o enum aprovacao_decisao do banco).
export const DECISOES = ["aprovado", "aprovado_com_ressalvas", "recusado"] as const;
export type Decisao = (typeof DECISOES)[number];

export const ROTULO_DECISAO: Record<Decisao, string> = {
  aprovado: "Aprovar",
  aprovado_com_ressalvas: "Aprovar com ressalvas",
  recusado: "Recusar",
};

// Validação da decisão enviada pela pessoa que recebeu o link (sem login).
export const aprovacaoSchema = z.object({
  revisor_nome: z.string().trim().min(2, "Informe seu nome."),
  revisor_email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  decisao: z.enum(DECISOES),
  justificativa: z
    .string()
    .trim()
    .max(2000, "Comentário muito longo (máx. 2000 caracteres).")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type AprovacaoInput = z.infer<typeof aprovacaoSchema>;
