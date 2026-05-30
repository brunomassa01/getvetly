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

/**
 * Lê largura/altura (px) de um logo a partir dos bytes, para preservar a
 * proporção no PPT. Suporta PNG, JPEG e GIF; retorna null para outros formatos.
 */
export function dimensoesImagem(bytes: Buffer): { w: number; h: number } | null {
  // PNG: assinatura + IHDR (largura no offset 16, altura no 20).
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  }
  // GIF: largura/altura little-endian nos offsets 6 e 8.
  if (bytes.length >= 10 && bytes[0] === 0x47 && bytes[1] === 0x49) {
    return { w: bytes.readUInt16LE(6), h: bytes.readUInt16LE(8) };
  }
  // JPEG: percorre os marcadores até um SOF (Start Of Frame).
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marcador = bytes[i + 1];
      // SOF0..SOF15, exceto DHT(C4), JPG(C8) e DAC(CC).
      const ehSof =
        marcador >= 0xc0 &&
        marcador <= 0xcf &&
        marcador !== 0xc4 &&
        marcador !== 0xc8 &&
        marcador !== 0xcc;
      if (ehSof) {
        return { h: bytes.readUInt16BE(i + 5), w: bytes.readUInt16BE(i + 7) };
      }
      const tamanho = bytes.readUInt16BE(i + 2);
      i += 2 + tamanho;
    }
  }
  return null;
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
