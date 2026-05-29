import { describe, it, expect } from "vitest";
import { fornecedorSchema } from "./schema";

describe("fornecedorSchema", () => {
  it("aceita um fornecedor válido com todos os campos", () => {
    const resultado = fornecedorSchema.safeParse({
      nome: "Eletromidia ES",
      cnpj: "12.345.678/0001-90",
      email: "contato@eletromidia.com.br",
      telefone: "(27) 99999-0000",
      segmento: "midia",
      observacoes: "Fornecedor de mídia OOH no ES",
    });
    expect(resultado.success).toBe(true);
  });

  it("aceita só o nome (campos opcionais vazios viram undefined)", () => {
    const resultado = fornecedorSchema.safeParse({
      nome: "Fornecedor Simples",
      cnpj: "",
      email: "",
      telefone: "",
      segmento: "",
      observacoes: "",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.email).toBeUndefined();
      expect(resultado.data.segmento).toBeUndefined();
    }
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const resultado = fornecedorSchema.safeParse({ nome: "A" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita e-mail inválido quando preenchido", () => {
    const resultado = fornecedorSchema.safeParse({
      nome: "Fornecedor X",
      email: "isso-nao-e-email",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita categoria fora da lista permitida", () => {
    const resultado = fornecedorSchema.safeParse({
      nome: "Fornecedor Y",
      segmento: "categoria-inexistente",
    });
    expect(resultado.success).toBe(false);
  });
});
