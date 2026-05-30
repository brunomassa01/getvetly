import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deckSchema, type Deck } from "./deck-schema";

function baseDir(): string {
  return process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
}

// chave = "comparativo-<id>" ou "proposta-<id>" (saneada).
function caminhoDeck(chave: string): string {
  const segura = chave.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(baseDir(), "decks", `${segura}.json`);
}

/**
 * Lê o deck (plano de apresentação) já salvo em disco. Retorna null se ainda
 * não foi gerado ou se o arquivo estiver corrompido.
 */
export async function lerDeckCache(chave: string): Promise<Deck | null> {
  try {
    const bruto = await readFile(caminhoDeck(chave), "utf8");
    const parsed = deckSchema.safeParse(JSON.parse(bruto));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Salva o deck em disco para reuso (HTML, PDF e PPT usam o mesmo). */
export async function salvarDeckCache(chave: string, deck: Deck): Promise<void> {
  const arquivo = caminhoDeck(chave);
  await mkdir(path.dirname(arquivo), { recursive: true });
  await writeFile(arquivo, JSON.stringify(deck), "utf8");
}
