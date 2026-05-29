import { z } from "zod";
import { CATEGORIAS } from "@/lib/fornecedores/schema";

// Valor monetário opcional: aceita "", "209112.38" ou "209112,38".
const valorOpcional = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(String(v).replace(/\./g, "").replace(",", "."));
    return Number.isNaN(n) ? undefined : n;
  },
  z.number().nonnegative().optional(),
);

const vazioParaUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const propostaSchema = z.object({
  titulo: z.string().trim().min(2, "Informe um título para a proposta"),
  fornecedor_id: z.preprocess(
    vazioParaUndefined,
    z.string().uuid().optional(),
  ),
  categoria: z.enum(CATEGORIAS, {
    message: "Selecione uma categoria",
  }),
  escopo: z.preprocess(
    vazioParaUndefined,
    z.string().trim().optional(),
  ),
  aprovador_email: z.preprocess(
    vazioParaUndefined,
    z.string().email("E-mail do aprovador inválido").optional(),
  ),
  valor_tabela: valorOpcional,
  valor_negociado: valorOpcional,
});

export type PropostaInput = z.infer<typeof propostaSchema>;

export const STATUS_PROPOSTA: Record<string, string> = {
  draft: "Rascunho",
  uploading: "Enviando",
  processing: "Analisando",
  ready: "Pronta",
  failed: "Falhou",
  archived: "Arquivada",
};
