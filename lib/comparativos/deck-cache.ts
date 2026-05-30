import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deckSchema, type Deck } from "./deck-schema";

function baseDir(): string {
  return process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
}

function caminhoDeck(comparativoId: string): string {
  return path.join(baseDir(), "decks", `comparativo-${comparativoId}.json`);
}

/**
 * Lê o deck (plano de apresentação) já salvo em disco. Retorna null se ainda
 * não foi gerado ou se o arquivo estiver corrompido.
 */
export async function lerDeckCache(comparativoId: string): Promise<Deck | null> {
  try {
    const bruto = await readFile(caminhoDeck(comparativoId), "utf8");
    const parsed = deckSchema.safeParse(JSON.parse(bruto));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Salva o deck em disco para reuso (HTML, PDF e PPT usam o mesmo). */
export async function salvarDeckCache(
  comparativoId: string,
  deck: Deck,
): Promise<void> {
  const arquivo = caminhoDeck(comparativoId);
  await mkdir(path.dirname(arquivo), { recursive: true });
  await writeFile(arquivo, JSON.stringify(deck), "utf8");
}
