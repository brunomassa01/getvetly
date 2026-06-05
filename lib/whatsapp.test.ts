import { describe, it, expect } from "vitest";
import { normalizarTelefoneBr, linkWhatsapp } from "./whatsapp";

describe("normalizarTelefoneBr", () => {
  it("tira máscara e prefixa o DDI 55 do Brasil", () => {
    expect(normalizarTelefoneBr("(11) 99999-9999")).toBe("5511999999999");
    expect(normalizarTelefoneBr("11999999999")).toBe("5511999999999");
  });

  it("mantém o 55 quando já vem com DDI", () => {
    expect(normalizarTelefoneBr("+55 11 99999-9999")).toBe("5511999999999");
    expect(normalizarTelefoneBr("5511999999999")).toBe("5511999999999");
  });

  it("telefone vazio vira string vazia", () => {
    expect(normalizarTelefoneBr("")).toBe("");
    expect(normalizarTelefoneBr("abc")).toBe("");
  });
});

describe("linkWhatsapp", () => {
  it("monta o link wa.me com a mensagem escapada", () => {
    const url = linkWhatsapp("11999999999", "Oi, tudo bem?");
    expect(url).toBe(
      "https://wa.me/5511999999999?text=Oi%2C%20tudo%20bem%3F",
    );
  });

  it("escapa quebras de linha e caracteres especiais", () => {
    const url = linkWhatsapp("11999999999", "linha1\nlinha2 & cia");
    expect(url).toContain("https://wa.me/5511999999999?text=");
    expect(url).toContain("linha1%0Alinha2%20%26%20cia");
  });
});
