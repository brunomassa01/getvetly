import "server-only";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

function baseDir(): string {
  return process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");
}

function caminho(workspaceId: string): string {
  return path.join(baseDir(), "whitelabel", workspaceId, "design-system.md");
}

/** Salva o markdown do design system no disco. */
export async function salvarDesignMd(
  workspaceId: string,
  conteudo: string,
): Promise<void> {
  const dir = path.join(baseDir(), "whitelabel", workspaceId);
  await mkdir(dir, { recursive: true });
  await writeFile(caminho(workspaceId), conteudo, "utf-8");
}

/** Indica se a empresa já enviou um design system. */
export async function temDesignMd(workspaceId: string): Promise<boolean> {
  try {
    await access(caminho(workspaceId));
    return true;
  } catch {
    return false;
  }
}
