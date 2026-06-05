import "server-only";
import { withUser } from "@/lib/db/client";
import { salvarDesignMd } from "./design";
import { ehPdfMarca, ehTextoMarca } from "./arquivo-marca";
import { extrairTokensDesign } from "@/lib/ai/design-tokens";

// Processamento do arquivo de marca (PDF/texto) das Configurações.
// Fica isolado AQUI (e não em db.ts) de propósito: ele usa `unpdf`, que é
// pesado e tem um quirk de ESM (import.meta). Mantendo o unpdf fora do db.ts,
// rotas leves que importam db.ts (ex.: /api/whitelabel) não puxam o unpdf
// para o bundle — o que quebrava o build.

/**
 * Lê o conteúdo de texto do arquivo de marca. Aceita PDF (manual de marca —
 * extrai o texto com unpdf, igual às propostas) e arquivos de texto
 * (.md/.css/.json/.txt). Outros formatos lançam um erro com mensagem clara.
 */
async function lerConteudoMarca(arquivo: File): Promise<string> {
  if (ehPdfMarca(arquivo.name, arquivo.type)) {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const buffer = new Uint8Array(await arquivo.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (ehTextoMarca(arquivo.name, arquivo.type)) {
    return arquivo.text();
  }
  throw new Error(
    "Esse arquivo não dá pra ler aqui. Use um PDF do manual de marca ou um arquivo de texto (.md, .css, .json). O logotipo vai no campo de logotipo, acima.",
  );
}

/**
 * Processa o upload do arquivo de marca: lê o texto (PDF ou texto), guarda o
 * conteúdo, extrai as cores com IA e atualiza só as cores que foram encontradas.
 * Retorna se alguma cor foi atualizada (para a mensagem ao usuário).
 */
export async function salvarDesignSystemWorkspace(
  userId: string,
  arquivo: File,
): Promise<{ coresAtualizadas: boolean }> {
  const workspaceId = await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and role = 'admin' and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Sem permissão para editar a empresa.");
    return membro.workspace_id;
  });

  const conteudo = await lerConteudoMarca(arquivo);
  await salvarDesignMd(workspaceId, conteudo);

  const tokens = await extrairTokensDesign(conteudo);
  await withUser(userId, (sql) =>
    sql`
      update workspaces set
        whitelabel_cor_primaria = coalesce(${tokens.cor_primaria}, whitelabel_cor_primaria),
        whitelabel_cor_secundaria = coalesce(${tokens.cor_secundaria}, whitelabel_cor_secundaria)
      where id = ${workspaceId}
    `,
  );

  return {
    coresAtualizadas: Boolean(tokens.cor_primaria || tokens.cor_secundaria),
  };
}
