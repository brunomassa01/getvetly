import { z } from "zod";

// Schema rígido da análise retornada pela Claude (ver docs/03-backend/ai-pipeline.md).
const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

export const analiseSchema = z.object({
  fornecedor: z.object({
    nome: z.string().min(1),
    cnpj: z.string().nullable(),
    contato: z
      .object({
        nome: z.string().nullable(),
        email: z.string().nullable(),
        telefone: z.string().nullable(),
      })
      .nullable(),
  }),
  proposta: z.object({
    titulo: z.string().min(1),
    categoria: z.enum([
      "midia",
      "software",
      "servicos",
      "produtos",
      "brindes",
      "outro",
    ]),
    escopo: z.string().nullable(),
    periodo_inicio: dataIso,
    periodo_fim: dataIso,
    validade: dataIso,
    condicao_pagamento: z.string().nullable(),
  }),
  valores: z.object({
    tabela_total: z.number().nullable(),
    negociado_total: z.number().nullable(),
    desconto_pct: z.number().min(0).max(100).nullable(),
    economia: z.number().nullable(),
    moeda: z.literal("BRL"),
  }),
  itens: z.array(
    z.object({
      descricao: z.string(),
      quantidade: z.number().nullable(),
      valor_unitario_tabela: z.number().nullable(),
      valor_unitario_negociado: z.number().nullable(),
      valor_total_negociado: z.number().nullable(),
    }),
  ),
  metricas: z.array(
    z.object({
      nome: z.string(),
      valor: z.string(),
      unidade: z.string().nullable(),
      descricao: z.string().nullable(),
    }),
  ),
  specs_tecnicas: z.array(
    z.object({ campo: z.string(), valor: z.string() }),
  ),
  condicoes_comerciais: z.array(
    z.object({ campo: z.string(), valor: z.string() }),
  ),
  analise: z.object({
    resumo_executivo: z.string(),
    pros: z.array(z.string()),
    questionar: z.array(z.string()),
  }),
  metadata: z.object({
    arquivos_analisados: z.array(z.string()),
    confianca: z.enum(["alta", "media", "baixa"]),
    campos_nao_encontrados: z.array(z.string()),
  }),
});

export type Analise = z.infer<typeof analiseSchema>;
