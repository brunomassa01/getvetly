import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Diretório base de storage (disco do VPS em produção, ./storage no dev).
function diretorioBase(): string {
  return process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
}

function sanitizarNome(nome: string): string {
  return nome.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "arquivo";
}

export interface ArquivoSalvo {
  nomeStorage: string; // caminho relativo: <workspace>/<proposta>/<arquivo>
  tamanho: number;
  mime: string;
}

/** Salva um arquivo enviado em disco, isolado por workspace/proposta. */
export async function salvarArquivo(opts: {
  workspaceId: string;
  propostaId: string;
  arquivo: File;
}): Promise<ArquivoSalvo> {
  const { workspaceId, propostaId, arquivo } = opts;
  const dir = path.join(diretorioBase(), workspaceId, propostaId);
  await mkdir(dir, { recursive: true });

  const nomeSeguro = `${Date.now()}_${sanitizarNome(arquivo.name)}`;
  const destino = path.join(dir, nomeSeguro);
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(destino, bytes);

  return {
    nomeStorage: path.posix.join(workspaceId, propostaId, nomeSeguro),
    tamanho: bytes.length,
    mime: arquivo.type || "application/octet-stream",
  };
}
