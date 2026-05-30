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
  economia_total?: string | null;
  desconto_medio?: string | null;
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
        ) as cotacoes,
        (
          select coalesce(sum(p.economia), 0) from propostas p
          where p.fornecedor_id = f.id and p.status <> 'archived'
        ) as economia_total,
        (
          select round(avg(p.desconto_pct), 1) from propostas p
          where p.fornecedor_id = f.id and p.status <> 'archived'
            and p.desconto_pct is not null
        ) as desconto_medio
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

/**
 * Mescla fornecedores duplicados em um principal: re-aponta as propostas dos
 * duplicados para o principal, completa campos vazios do principal com dados
 * dos duplicados e arquiva os duplicados. Tudo numa transação (RLS aplicado).
 */
export async function mesclarFornecedores(
  userId: string,
  principalId: string,
  idsParaMesclar: string[],
): Promise<void> {
  const dups = idsParaMesclar.filter((id) => id && id !== principalId);
  if (dups.length === 0) return;

  await withUser(userId, async (sql) => {
    // Re-aponta as propostas dos duplicados para o principal.
    await sql`
      update propostas set fornecedor_id = ${principalId}
      where fornecedor_id = any(${dups}::uuid[])
    `;

    // Completa campos vazios do principal com o que houver nos duplicados.
    await sql`
      update fornecedores p set
        cnpj = coalesce(p.cnpj, d.cnpj),
        email = coalesce(p.email, d.email),
        telefone = coalesce(p.telefone, d.telefone),
        segmento = coalesce(p.segmento, d.segmento)
      from (
        select
          max(cnpj) as cnpj, max(email) as email,
          max(telefone) as telefone, max(segmento) as segmento
        from fornecedores where id = any(${dups}::uuid[])
      ) d
      where p.id = ${principalId}
    `;

    // Arquiva os duplicados (soft delete).
    await sql`
      update fornecedores set ativo = false where id = any(${dups}::uuid[])
    `;
  });
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
