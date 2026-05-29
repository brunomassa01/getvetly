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

type Formato = "pdf" | "xlsx" | "docx" | "pptx" | "texto" | "outro";

// Detecta o formato por mime-type OU extensão (o navegador nem sempre informa).
function detectarFormato(arquivo: ArquivoParaExtrair): Formato {
  const m = arquivo.mime_type.toLowerCase();
  const n = arquivo.nome_original.toLowerCase();
  if (m.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (
    m.includes("spreadsheetml") ||
    m.includes("ms-excel") ||
    n.endsWith(".xlsx") ||
    n.endsWith(".xls")
  )
    return "xlsx";
  if (m.includes("wordprocessingml") || n.endsWith(".docx")) return "docx";
  if (
    m.includes("presentationml") ||
    n.endsWith(".pptx") ||
    n.endsWith(".ppt")
  )
    return "pptx";
  if (m.startsWith("text/") || n.endsWith(".csv") || n.endsWith(".txt"))
    return "texto";
  return "outro";
}

async function extrairPdf(buffer: Buffer): Promise<string> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

// Excel: extrai TODAS as abas, com o nome de cada aba como separador.
async function extrairXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  return wb.SheetNames.map((nome) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[nome]);
    return `--- ABA: ${nome} ---\n${csv.trim()}`;
  }).join("\n\n");
}

// Word (DOCX) via mammoth — texto puro.
async function extrairDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

/** Extrai o texto de um arquivo conforme o formato. */
export async function extrairTextoArquivo(
  arquivo: ArquivoParaExtrair,
): Promise<string> {
  const buffer = await readFile(caminhoAbsoluto(arquivo.nome_storage));
  switch (detectarFormato(arquivo)) {
    case "pdf":
      return extrairPdf(buffer);
    case "xlsx":
      return extrairXlsx(buffer);
    case "docx":
      return extrairDocx(buffer);
    case "pptx":
      // PPTs costumam trazer imagens/fotos. A leitura de imagem (OCR) chega
      // com o Mistral; por ora, os dados vêm dos demais arquivos da proposta.
      return `[Arquivo "${arquivo.nome_original}": PowerPoint (provavelmente imagens/fotos). A leitura de imagens por OCR chega em breve — considere os dados dos demais arquivos desta proposta.]`;
    case "texto":
      return buffer.toString("utf-8");
    default:
      return `[Arquivo "${arquivo.nome_original}" (${arquivo.mime_type}) não pôde ser lido automaticamente. Formatos suportados: PDF, Excel, Word, CSV e texto.]`;
  }
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
