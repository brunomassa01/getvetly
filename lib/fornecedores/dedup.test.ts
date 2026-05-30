import { describe, it, expect } from "vitest";
import { normalizarNome, distanciaEdicao, agruparDuplicados } from "./dedup";
import type { Fornecedor } from "./db";

function f(id: string, nome: string, cotacoes = 0): Fornecedor {
  return {
    id,
    nome,
    cnpj: null,
    email: null,
    telefone: null,
    segmento: null,
    observacoes: null,
    created_at: "2026-05-30",
    cotacoes,
  };
}

describe("normalizarNome", () => {
  it("remove acento, caixa e pontuação", () => {
    expect(normalizarNome("Eletromídia S.A.")).toBe("eletromidia s a");
  });
});

describe("distanciaEdicao", () => {
  it("conta as edições entre duas strings", () => {
    expect(distanciaEdicao("eletromidia", "eltormidia")).toBeLessThanOrEqual(3);
    expect(distanciaEdicao("abc", "abc")).toBe(0);
  });
});

describe("agruparDuplicados", () => {
  it("agrupa variações do mesmo nome (acento, caixa e erro de digitação)", () => {
    const lista = [
      f("1", "Eletromidia", 3),
      f("2", "Eletromídia", 1),
      f("3", "Eltormidia", 0),
      f("4", "JCDecaux"),
    ];
    const grupos = agruparDuplicados(lista);
    expect(grupos).toHaveLength(1);
    // 3 variações no grupo; o de mais cotações vem primeiro (sugerido principal)
    expect(grupos[0].fornecedores).toHaveLength(3);
    expect(grupos[0].fornecedores[0].nome).toBe("Eletromidia");
  });

  it("não agrupa fornecedores claramente distintos", () => {
    const grupos = agruparDuplicados([
      f("1", "JCDecaux"),
      f("2", "Eletromidia"),
      f("3", "Clear Channel"),
    ]);
    expect(grupos).toHaveLength(0);
  });
});
