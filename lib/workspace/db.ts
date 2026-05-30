import "server-only";
import { withUser } from "@/lib/db/client";
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
}

/** Workspace do usuário logado. */
export async function buscarWorkspaceDoUsuario(
  userId: string,
): Promise<Workspace | null> {
  return withUser(userId, async (sql) => {
    const [ws] = await sql<Workspace[]>`
      select w.id, w.nome, w.cnpj, w.segmento, w.tamanho, w.tier,
        w.whitelabel_empresa_nome, w.whitelabel_cor_primaria
      from workspaces w
      join workspace_members m on m.workspace_id = w.id
      where m.user_id = ${userId} and m.ativo = true
      limit 1
    `;
    return ws ?? null;
  });
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
        whitelabel_cor_primaria = ${dados.whitelabel_cor_primaria ?? "#0A0A0A"}
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
