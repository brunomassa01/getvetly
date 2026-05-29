import { describe, it, expect } from "vitest";
import { propostaSchema } from "./schema";

describe("propostaSchema", () => {
  it("aceita uma proposta válida e converte o valor BR para número", () => {
    const r = propostaSchema.safeParse({
      titulo: "Campanha CLT - Eletromidia",
      fornecedor_id: "",
      categoria: "midia",
      escopo: "São Paulo, 28 dias",
      aprovador_email: "diretor@empresa.com",
      valor_tabela: "209.112,38",
      valor_negociado: "180000,00",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.valor_tabela).toBeCloseTo(209112.38, 2);
      expect(r.data.valor_negociado).toBeCloseTo(180000, 2);
      expect(r.data.fornecedor_id).toBeUndefined();
    }
  });

  it("exige título e categoria", () => {
    expect(propostaSchema.safeParse({ titulo: "X" }).success).toBe(false);
    expect(
      propostaSchema.safeParse({ titulo: "Proposta", categoria: "invalida" })
        .success,
    ).toBe(false);
  });

  it("rejeita e-mail de aprovador inválido", () => {
    const r = propostaSchema.safeParse({
      titulo: "Proposta boa",
      categoria: "software",
      aprovador_email: "nao-e-email",
    });
    expect(r.success).toBe(false);
  });
});
