import { z } from "zod";

// Categorias fixas (espelham o enum proposta_categoria do banco).
export const CATEGORIAS = [
  "midia",
  "software",
  "servicos",
  "produtos",
  "brindes",
  "outro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  midia: "Mídia",
  software: "Software",
  servicos: "Serviços",
  produtos: "Produtos",
  brindes: "Brindes",
  outro: "Outro",
};

// Campos de texto opcionais: string vazia vira undefined.
const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do fornecedor"),
  cnpj: textoOpcional,
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  telefone: textoOpcional,
  segmento: z.enum(CATEGORIAS).optional().or(z.literal("").transform(() => undefined)),
  observacoes: textoOpcional,
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;
