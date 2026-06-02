import { describe, it, expect } from "vitest";
import { aprovacaoSchema } from "./schema";

describe("aprovacaoSchema", () => {
  it("aceita uma decisão válida com campos mínimos", () => {
    const r = aprovacaoSchema.safeParse({
      revisor_nome: "Maria Diretora",
      decisao: "aprovado",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.revisor_nome).toBe("Maria Diretora");
      expect(r.data.revisor_email).toBeUndefined();
      expect(r.data.justificativa).toBeUndefined();
    }
  });

  it("trata e-mail e comentário vazios como ausentes (opcionais)", () => {
    const r = aprovacaoSchema.safeParse({
      revisor_nome: "João",
      decisao: "aprovado_com_ressalvas",
      revisor_email: "",
      justificativa: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.revisor_email).toBeUndefined();
      expect(r.data.justificativa).toBeUndefined();
    }
  });

  it("exige nome com ao menos 2 caracteres", () => {
    expect(
      aprovacaoSchema.safeParse({ revisor_nome: "A", decisao: "recusado" })
        .success,
    ).toBe(false);
  });

  it("rejeita decisão fora do enum e e-mail inválido", () => {
    expect(
      aprovacaoSchema.safeParse({ revisor_nome: "Ana", decisao: "talvez" })
        .success,
    ).toBe(false);
    expect(
      aprovacaoSchema.safeParse({
        revisor_nome: "Ana",
        decisao: "aprovado",
        revisor_email: "nao-e-email",
      }).success,
    ).toBe(false);
  });
});
