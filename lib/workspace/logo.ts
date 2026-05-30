import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

function baseDir(): string {
  return process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
}

const EXT_PERMITIDAS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Salva o logo do whitelabel no disco. Retorna o caminho relativo salvo. */
export async function salvarLogo(
  workspaceId: string,
  arquivo: File,
): Promise<string> {
  const ext = EXT_PERMITIDAS[arquivo.type];
  if (!ext) {
    throw new Error("Formato de logo inválido. Use PNG, JPG, WEBP ou SVG.");
  }
  if (arquivo.size > 2 * 1024 * 1024) {
    throw new Error("Logo muito grande (máximo 2 MB).");
  }

  const dir = path.join(baseDir(), "whitelabel", workspaceId);
  await mkdir(dir, { recursive: true });
  const nome = `logo.${ext}`;
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(path.join(dir, nome), bytes);

  return path.posix.join("whitelabel", workspaceId, nome);
}

/** Lê o arquivo de logo a partir do caminho relativo salvo. */
export async function lerLogo(
  nomeStorage: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const bytes = await readFile(path.join(baseDir(), nomeStorage));
  const ext = path.extname(nomeStorage).slice(1).toLowerCase();
  const contentType =
    ext === "svg"
      ? "image/svg+xml"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
  return { bytes, contentType };
}
