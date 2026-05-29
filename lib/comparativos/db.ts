import "server-only";
import { withUser } from "@/lib/db/client";
import { buscarAnalise } from "@/lib/propostas/db";
import { compararPropostas } from "@/lib/ai/comparar";
import type { Comparativo } from "@/lib/ai/comparar-schema";

export interface ComparativoListaItem {
  id: string;
  titulo: string;
  created_at: string;
  qtd_propostas: number;
}

export interface ComparativoDetalhe {
  id: string;
  titulo: string;
  recomendacao: string | null;
  created_at: string;
  payload: Comparativo;
}

/** Propostas já analisadas (status ready) — candidatas a comparação. */
export async function listarPropostasProntas(
  userId: string,
): Promise<{ id: string; titulo: string; fornecedor_nome: string | null }[]> {
  return withUser(userId, (sql) =>
    sql<{ id: string; titulo: string; fornecedor_nome: string | null }[]>`
      select p.id, p.titulo, f.nome as fornecedor_nome
      from propostas p
      left join fornecedores f on f.id = p.fornecedor_id
      where p.status = 'ready'
      order by p.created_at desc
    `,
  );
}

async function tituloDaProposta(
  userId: string,
  propostaId: string,
): Promise<string | null> {
  return withUser(userId, async (sql) => {
    const [p] = await sql<{ titulo: string }[]>`
      select titulo from propostas where id = ${propostaId}
    `;
    return p?.titulo ?? null;
  });
}

/** Gera e salva uma comparação entre 2+ propostas analisadas. */
export async function criarComparativo(
  userId: string,
  input: { titulo: string; propostaIds: string[]; criterios: string },
): Promise<{ id: string }> {
  const propostas: { ref: string; analise: Awaited<ReturnType<typeof buscarAnalise>> }[] =
    [];
  for (const pid of input.propostaIds) {
    const analise = await buscarAnalise(userId, pid);
    const titulo = await tituloDaProposta(userId, pid);
    if (analise && titulo) propostas.push({ ref: titulo, analise });
  }

  const validas = propostas.filter(
    (p): p is { ref: string; analise: NonNullable<typeof p.analise> } =>
      p.analise !== null,
  );
  if (validas.length < 2) {
    throw new Error(
      "Selecione ao menos 2 propostas já analisadas (status Pronta).",
    );
  }

  const resultado = await compararPropostas({
    criterios: input.criterios,
    propostas: validas,
  });

  const id = await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [comparativo] = await sql<{ id: string }[]>`
      insert into comparativos
        (workspace_id, criado_por, titulo, proposta_ids, payload, recomendacao)
      values (
        ${membro.workspace_id}, ${userId}, ${input.titulo},
        ${input.propostaIds}::uuid[],
        ${JSON.stringify(resultado.comparativo)}::jsonb,
        ${resultado.comparativo.recomendacao}
      )
      returning id
    `;
    return comparativo.id;
  });

  return { id };
}

export async function listarComparativos(
  userId: string,
): Promise<ComparativoListaItem[]> {
  return withUser(userId, (sql) =>
    sql<ComparativoListaItem[]>`
      select id, titulo, created_at,
        coalesce(array_length(proposta_ids, 1), 0) as qtd_propostas
      from comparativos
      order by created_at desc
    `,
  );
}

export async function buscarComparativo(
  userId: string,
  id: string,
): Promise<ComparativoDetalhe | null> {
  return withUser(userId, async (sql) => {
    const [linha] = await sql<
      {
        id: string;
        titulo: string;
        recomendacao: string | null;
        created_at: string;
        payload: unknown;
      }[]
    >`
      select id, titulo, recomendacao, created_at, payload
      from comparativos where id = ${id}
    `;
    if (!linha) return null;
    const payload =
      typeof linha.payload === "string"
        ? (JSON.parse(linha.payload) as Comparativo)
        : (linha.payload as Comparativo);
    return { ...linha, payload };
  });
}
