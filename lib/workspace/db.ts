import "server-only";
import { withUser, getSqlService } from "@/lib/db/client";
import { salvarLogo } from "./logo";
import { temDesignMd } from "./design";
import type { WorkspaceInput } from "./schema";

export interface Workspace {
  id: string;
  nome: string;
  cnpj: string | null;
  segmento: string | null;
  tamanho: string | null;
  tier: string;
  whitelabel_empresa_nome: string | null;
  whitelabel_cor_primaria: string | null;
  whitelabel_cor_secundaria: string | null;
  whitelabel_logo_url: string | null;
  tem_design_system?: boolean;
}

/** Workspace do usuário logado. */
export async function buscarWorkspaceDoUsuario(
  userId: string,
): Promise<Workspace | null> {
  const ws = await withUser(userId, async (sql) => {
    const [w] = await sql<Workspace[]>`
      select w.id, w.nome, w.cnpj, w.segmento, w.tamanho, w.tier,
        w.whitelabel_empresa_nome, w.whitelabel_cor_primaria,
        w.whitelabel_cor_secundaria, w.whitelabel_logo_url
      from workspaces w
      join workspace_members m on m.workspace_id = w.id
      where m.user_id = ${userId} and m.ativo = true
      limit 1
    `;
    return w ?? null;
  });
  if (!ws) return null;
  ws.tem_design_system = await temDesignMd(ws.id);
  return ws;
}

/** Salva o logo do whitelabel e grava o caminho no workspace (somente admin). */
export async function salvarLogoWorkspace(
  userId: string,
  arquivo: File,
): Promise<void> {
  const workspaceId = await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and role = 'admin' and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Sem permissão para editar a empresa.");
    return membro.workspace_id;
  });

  const caminho = await salvarLogo(workspaceId, arquivo);

  await withUser(userId, (sql) =>
    sql`update workspaces set whitelabel_logo_url = ${caminho} where id = ${workspaceId}`,
  );
}

/** Caminho do logo de um workspace (rota pública servir a imagem). Service. */
export async function caminhoLogoWorkspace(
  workspaceId: string,
): Promise<string | null> {
  const sql = getSqlService();
  const [ws] = await sql<{ whitelabel_logo_url: string | null }[]>`
    select whitelabel_logo_url from workspaces where id = ${workspaceId}
  `;
  return ws?.whitelabel_logo_url ?? null;
}

/**
 * Workspace por id, via SERVICE (ignora RLS). Use APENAS em rotas públicas
 * já validadas por token (ex: /r/[token]) — para aplicar o whitelabel
 * (logo + cores) no relatório compartilhado, sem usuário logado.
 */
export async function buscarWorkspacePorId(
  workspaceId: string,
): Promise<Workspace | null> {
  const sql = getSqlService();
  const [w] = await sql<Workspace[]>`
    select w.id, w.nome, w.cnpj, w.segmento, w.tamanho, w.tier,
      w.whitelabel_empresa_nome, w.whitelabel_cor_primaria,
      w.whitelabel_cor_secundaria, w.whitelabel_logo_url
    from workspaces w
    where w.id = ${workspaceId}
  `;
  return w ?? null;
}

/** Atualiza os dados da empresa (somente admin — RLS aplica). */
export async function atualizarWorkspace(
  userId: string,
  dados: WorkspaceInput,
): Promise<void> {
  await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and role = 'admin' and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Sem permissão para editar a empresa.");

    await sql`
      update workspaces set
        nome = ${dados.nome},
        cnpj = ${dados.cnpj ?? null},
        segmento = ${dados.segmento ?? null},
        tamanho = ${dados.tamanho ?? null},
        whitelabel_empresa_nome = ${dados.whitelabel_empresa_nome ?? null},
        whitelabel_cor_primaria = ${dados.whitelabel_cor_primaria ?? "#0A0A0A"},
        whitelabel_cor_secundaria = ${dados.whitelabel_cor_secundaria ?? "#C8FF02"}
      where id = ${membro.workspace_id}
    `;
  });
}

/** Contagens rápidas para o painel. */
export async function contagensPainel(
  userId: string,
): Promise<{ propostas: number; fornecedores: number; comparativos: number }> {
  return withUser(userId, async (sql) => {
    const [linha] = await sql<
      { propostas: number; fornecedores: number; comparativos: number }[]
    >`
      select
        (select count(*)::int from propostas where status <> 'archived') as propostas,
        (select count(*)::int from fornecedores where ativo = true) as fornecedores,
        (select count(*)::int from comparativos) as comparativos
    `;
    return linha;
  });
}
