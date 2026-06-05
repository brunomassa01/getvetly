import { describe, it, expect } from "vitest";
import {
  ehPdfMarca,
  ehTextoMarca,
  ehArquivoMarcaSuportado,
} from "./arquivo-marca";

describe("ehPdfMarca", () => {
  it("reconhece PDF por mime-type ou extensão", () => {
    expect(ehPdfMarca("manual.pdf", "application/pdf")).toBe(true);
    expect(ehPdfMarca("Manual_ReBrand.PDF", "")).toBe(true); // sem mime
    expect(ehPdfMarca("cores.css", "text/css")).toBe(false);
  });
});

describe("ehTextoMarca", () => {
  it("aceita md/css/json/txt e mime-types de texto", () => {
    expect(ehTextoMarca("colors.css", "text/css")).toBe(true);
    expect(ehTextoMarca("tokens.json", "application/json")).toBe(true);
    expect(ehTextoMarca("design.md", "")).toBe(true);
    expect(ehTextoMarca("notas.txt", "text/plain")).toBe(true);
  });

  it("recusa PDF e imagens", () => {
    expect(ehTextoMarca("manual.pdf", "application/pdf")).toBe(false);
    expect(ehTextoMarca("logo.png", "image/png")).toBe(false);
  });
});

describe("ehArquivoMarcaSuportado", () => {
  it("suporta PDF e texto; recusa imagem/binário", () => {
    expect(ehArquivoMarcaSuportado("manual.pdf", "application/pdf")).toBe(true);
    expect(ehArquivoMarcaSuportado("colors.css", "text/css")).toBe(true);
    expect(ehArquivoMarcaSuportado("logo.png", "image/png")).toBe(false);
    expect(ehArquivoMarcaSuportado("planilha.xlsx", "")).toBe(false);
  });
});
