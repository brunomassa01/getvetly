type Celula = string | number | null | undefined;

/**
 * Monta um CSV (separador ";", que o Excel pt-BR entende) com BOM UTF-8 para
 * os acentos aparecerem certos no Excel.
 */
export function paraCsv(headers: string[], linhas: Celula[][]): string {
  const esc = (v: Celula): string => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linha = (arr: Celula[]) => arr.map(esc).join(";");
  const corpo = [headers, ...linhas].map(linha).join("\r\n");
  return "﻿" + corpo; // BOM UTF-8 para o Excel ler acentos corretamente
}

/** Resposta HTTP de download de um CSV. */
export function respostaCsv(csv: string, nomeArquivo: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
