import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const EXT_PERMITIDAS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

/** Salva a foto de perfil no disco. Retorna o caminho relativo salvo. */
export async function salvarAvatar(
  userId: string,
  arquivo: File,
): Promise<string> {
  const ext = EXT_PERMITIDAS[arquivo.type];
  if (!ext) throw new Error("Formato de foto inválido. Use PNG, JPG ou WEBP.");
  if (arquivo.size > 2 * 1024 * 1024) {
    throw new Error("Foto muito grande (máximo 2 MB).");
  }

  const base = process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
  const dir = path.join(base, "avatars");
  await mkdir(dir, { recursive: true });
  const nome = `${userId}.${ext}`;
  await writeFile(path.join(dir, nome), Buffer.from(await arquivo.arrayBuffer()));

  return path.posix.join("avatars", nome);
}
