import { describe, it, expect } from "vitest";
import { analiseSchema } from "./schema";

const analiseValida = {
  fornecedor: { nome: "Eletromidia ES", cnpj: null, contato: null },
  proposta: {
    titulo: "Campanha CLT",
    categoria: "midia",
    escopo: "São Paulo, 28 dias",
    periodo_inicio: "2026-06-01",
    periodo_fim: "2026-06-28",
    validade: null,
    condicao_pagamento: "30 dias",
  },
  valores: {
    tabela_total: 209112.38,
    negociado_total: 180000,
    desconto_pct: 13.9,
    economia: 29112.38,
    moeda: "BRL",
  },
  itens: [],
  metricas: [],
  specs_tecnicas: [],
  condicoes_comerciais: [],
  analise: {
    resumo_executivo: "Proposta competitiva com bom desconto.",
    pros: ["Desconto de 14%"],
    questionar: ["Validade não informada"],
  },
  metadata: {
    arquivos_analisados: ["proposta.pdf"],
    confianca: "alta",
    campos_nao_encontrados: ["validade"],
  },
};

describe("analiseSchema", () => {
  it("valida uma análise bem formada", () => {
    expect(analiseSchema.safeParse(analiseValida).success).toBe(true);
  });

  it("rejeita categoria fora do enum", () => {
    const ruim = {
      ...analiseValida,
      proposta: { ...analiseValida.proposta, categoria: "xpto" },
    };
    expect(analiseSchema.safeParse(ruim).success).toBe(false);
  });

  it("rejeita data em formato inválido", () => {
    const ruim = {
      ...analiseValida,
      proposta: { ...analiseValida.proposta, periodo_inicio: "01/06/2026" },
    };
    expect(analiseSchema.safeParse(ruim).success).toBe(false);
  });

  it("rejeita confianca fora do enum", () => {
    const ruim = {
      ...analiseValida,
      metadata: { ...analiseValida.metadata, confianca: "altíssima" },
    };
    expect(analiseSchema.safeParse(ruim).success).toBe(false);
  });
});
