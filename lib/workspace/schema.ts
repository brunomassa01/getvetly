import { z } from "zod";

export const SEGMENTOS = [
  "industria",
  "servicos",
  "varejo",
  "tecnologia",
  "saude",
  "educacao",
  "outro",
] as const;

export const ROTULO_SEGMENTO: Record<string, string> = {
  industria: "Indústria",
  servicos: "Serviços",
  varejo: "Varejo",
  tecnologia: "Tecnologia",
  saude: "Saúde",
  educacao: "Educação",
  outro: "Outro",
};

export const TAMANHOS = ["pequena", "media", "grande"] as const;

export const ROTULO_TAMANHO: Record<string, string> = {
  pequena: "Pequena (até 50 pessoas)",
  media: "Média (51 a 500)",
  grande: "Grande (500+)",
};

const opcional = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const workspaceSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z.preprocess(opcional, z.string().trim().optional()),
  segmento: z.preprocess(opcional, z.enum(SEGMENTOS).optional()),
  tamanho: z.preprocess(opcional, z.enum(TAMANHOS).optional()),
  whitelabel_empresa_nome: z.preprocess(
    opcional,
    z.string().trim().optional(),
  ),
  whitelabel_cor_primaria: z.preprocess(
    opcional,
    z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB")
      .optional(),
  ),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;
