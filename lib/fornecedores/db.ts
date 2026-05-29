import "server-only";
import { withUser } from "@/lib/db/client";
import type { FornecedorInput } from "./schema";

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  segmento: string | null;
  observacoes: string | null;
  created_at: string;
  cotacoes?: number;
}

export interface FiltrosFornecedor {
  busca?: string;
  categoria?: string;
}

/** Lista fornecedores ativos do workspace do usuário (RLS aplicado). */
export async function listarFornecedores(
  userId: string,
  filtros: FiltrosFornecedor = {},
): Promise<Fornecedor[]> {
  const busca = filtros.busca?.trim();
  const categoria = filtros.categoria?.trim();

  return withUser(userId, (sql) =>
    sql<Fornecedor[]>`
      select
        f.id, f.nome, f.cnpj, f.email, f.telefone, f.segmento,
        f.observacoes, f.created_at,
        (
          select count(*)::int from propostas p
          where p.fornecedor_id = f.id and p.status <> 'archived'
        ) as cotacoes
      from fornecedores f
      where f.ativo = true
        ${busca ? sql`and f.nome ilike ${"%" + busca + "%"}` : sql``}
        ${categoria ? sql`and f.segmento = ${categoria}` : sql``}
      order by f.nome asc
    `,
  );
}

/** Busca um fornecedor pelo id (RLS garante que é do workspace do usuário). */
export async function buscarFornecedor(
  userId: string,
  id: string,
): Promise<Fornecedor | null> {
  return withUser(userId, async (sql) => {
    const [fornecedor] = await sql<Fornecedor[]>`
      select id, nome, cnpj, email, telefone, segmento, observacoes, created_at
      from fornecedores
      where id = ${id} and ativo = true
    `;
    return fornecedor ?? null;
  });
}

/** Cria um fornecedor no workspace do usuário. */
export async function criarFornecedor(
  userId: string,
  dados: FornecedorInput,
): Promise<{ id: string }> {
  return withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [fornecedor] = await sql<{ id: string }[]>`
      insert into fornecedores
        (workspace_id, nome, cnpj, email, telefone, segmento, observacoes)
      values (
        ${membro.workspace_id},
        ${dados.nome},
        ${dados.cnpj ?? null},
        ${dados.email ?? null},
        ${dados.telefone ?? null},
        ${dados.segmento ?? null},
        ${dados.observacoes ?? null}
      )
      returning id
    `;
    return fornecedor;
  });
}

/**
 * Encontra um fornecedor pelo nome (case-insensitive) no workspace, ou cria
 * um novo com os dados extraídos pela IA. Retorna o id. Usado no fluxo
 * "subir proposta → IA extrai fornecedor → vincula automaticamente".
 */
export async function encontrarOuCriarFornecedorPorNome(
  userId: string,
  dados: {
    nome: string;
    cnpj?: string | null;
    email?: string | null;
    telefone?: string | null;
    segmento?: string | null;
  },
): Promise<string> {
  return withUser(userId, async (sql) => {
    const [existente] = await sql<{ id: string }[]>`
      select id from fornecedores
      where ativo = true and lower(nome) = lower(${dados.nome})
      limit 1
    `;
    if (existente) return existente.id;

    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [novo] = await sql<{ id: string }[]>`
      insert into fornecedores (workspace_id, nome, cnpj, email, telefone, segmento)
      values (
        ${membro.workspace_id}, ${dados.nome}, ${dados.cnpj ?? null},
        ${dados.email ?? null}, ${dados.telefone ?? null}, ${dados.segmento ?? null}
      )
      returning id
    `;
    return novo.id;
  });
}

/** Atualiza um fornecedor existente. */
export async function atualizarFornecedor(
  userId: string,
  id: string,
  dados: FornecedorInput,
): Promise<void> {
  await withUser(userId, (sql) =>
    sql`
      update fornecedores set
        nome = ${dados.nome},
        cnpj = ${dados.cnpj ?? null},
        email = ${dados.email ?? null},
        telefone = ${dados.telefone ?? null},
        segmento = ${dados.segmento ?? null},
        observacoes = ${dados.observacoes ?? null}
      where id = ${id}
    `,
  );
}

/** Arquiva (soft delete) um fornecedor — marca ativo = false. */
export async function arquivarFornecedor(
  userId: string,
  id: string,
): Promise<void> {
  await withUser(userId, (sql) =>
    sql`update fornecedores set ativo = false where id = ${id}`,
  );
}
