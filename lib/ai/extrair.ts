import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

function caminhoAbsoluto(nomeStorage: string): string {
  const base = process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
  return path.join(base, nomeStorage);
}

export interface ArquivoParaExtrair {
  nome_original: string;
  nome_storage: string;
  mime_type: string;
}

async function extrairPdf(buffer: Buffer): Promise<string> {
  // unpdf é um wrapper do pdf.js, sem dependências nativas — funciona em Node.
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

/** Extrai o texto de um arquivo. PDFs via unpdf; texto/CSV direto. */
export async function extrairTextoArquivo(
  arquivo: ArquivoParaExtrair,
): Promise<string> {
  const buffer = await readFile(caminhoAbsoluto(arquivo.nome_storage));
  if (arquivo.mime_type === "application/pdf") {
    return extrairPdf(buffer);
  }
  if (arquivo.mime_type.startsWith("text/")) {
    return buffer.toString("utf-8");
  }
  return `[Arquivo "${arquivo.nome_original}" (${arquivo.mime_type}) não pôde ser lido automaticamente nesta versão. Suporte a planilhas, DOCX e PDF escaneado (OCR) chega em breve.]`;
}

/** Monta o contexto unificado para a IA, com separadores claros por arquivo. */
export async function montarContexto(
  arquivos: ArquivoParaExtrair[],
): Promise<{ contexto: string; nomes: string[] }> {
  const partes: string[] = [];
  const nomes: string[] = [];

  for (const arquivo of arquivos) {
    let texto: string;
    try {
      texto = await extrairTextoArquivo(arquivo);
    } catch {
      texto = `[Falha ao ler "${arquivo.nome_original}".]`;
    }
    nomes.push(arquivo.nome_original);
    partes.push(`=== ARQUIVO: ${arquivo.nome_original} ===\n${texto.trim()}`);
  }

  let contexto = partes.join("\n\n");
  const LIMITE_CHARS = 500_000; // ~150k tokens de margem
  if (contexto.length > LIMITE_CHARS) {
    contexto = contexto.slice(0, LIMITE_CHARS) + "\n\n[...conteúdo truncado...]";
  }
  return { contexto, nomes };
}
