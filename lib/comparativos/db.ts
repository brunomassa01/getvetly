import "server-only";
import { withUser } from "@/lib/db/client";
import { buscarAnalise } from "@/lib/propostas/db";
import { compararPropostas } from "@/lib/ai/comparar";
import type { Comparativo } from "@/lib/ai/comparar-schema";
import { montarDeck } from "./deck-plan";
import { lerDeckCache, salvarDeckCache } from "./deck-cache";
import type { Deck } from "./deck-schema";

export interface ComparativoListaItem {
  id: string;
  titulo: string;
  created_at: string;
  qtd_propostas: number;
  vencedor_ref: string | null;
  fornecedores: string[];
  situacao: string;
  escolhida: string | null; // título da proposta escolhida (decisão do usuário)
}

export interface ComparativoPropostaItem {
  id: string;
  titulo: string;
  situacao: string;
}

export interface ComparativoDetalhe {
  id: string;
  titulo: string;
  recomendacao: string | null;
  created_at: string;
  payload: Comparativo;
  situacao: string;
  apresentado_em: string | null;
  decidido_em: string | null;
  proposta_escolhida_id: string | null;
  propostas: ComparativoPropostaItem[];
}

export interface PropostaPronta {
  id: string;
  titulo: string;
  fornecedor_nome: string | null;
  valor_negociado: string | null;
  created_at: string;
}

/** Propostas já analisadas (status ready) — candidatas a comparação. */
export async function listarPropostasProntas(
  userId: string,
): Promise<PropostaPronta[]> {
  return withUser(userId, (sql) =>
    sql<PropostaPronta[]>`
      select p.id, p.titulo, p.valor_negociado, p.created_at,
        f.nome as fornecedor_nome
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
  filtros: { busca?: string } = {},
): Promise<ComparativoListaItem[]> {
  const busca = filtros.busca?.trim();
  const linhas = await withUser(userId, (sql) =>
    sql<
      {
        id: string;
        titulo: string;
        created_at: string;
        qtd_propostas: number;
        situacao: string;
        escolhida: string | null;
        payload: unknown;
      }[]
    >`
      select c.id, c.titulo, c.created_at,
        coalesce(array_length(c.proposta_ids, 1), 0) as qtd_propostas,
        c.situacao,
        (select pe.titulo from propostas pe where pe.id = c.proposta_escolhida_id) as escolhida,
        c.payload
      from comparativos c
      ${
        busca
          ? sql`where (c.titulo ilike ${"%" + busca + "%"} or c.payload::text ilike ${"%" + busca + "%"})`
          : sql``
      }
      order by c.created_at desc
    `,
  );

  return linhas.map((l) => {
    const payload = (
      typeof l.payload === "string" ? JSON.parse(l.payload) : l.payload
    ) as Comparativo | null;
    return {
      id: l.id,
      titulo: l.titulo,
      created_at: l.created_at,
      qtd_propostas: l.qtd_propostas,
      situacao: l.situacao,
      escolhida: l.escolhida,
      vencedor_ref: payload?.vencedor_ref ?? null,
      fornecedores: Array.isArray(payload?.propostas)
        ? payload.propostas.map((p) => p.fornecedor || p.ref)
        : [],
    };
  });
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
        situacao: string;
        apresentado_em: string | null;
        decidido_em: string | null;
        proposta_escolhida_id: string | null;
        proposta_ids: string[];
      }[]
    >`
      select id, titulo, recomendacao, created_at, payload,
        situacao, apresentado_em, decidido_em, proposta_escolhida_id, proposta_ids
      from comparativos where id = ${id}
    `;
    if (!linha) return null;
    const payload =
      typeof linha.payload === "string"
        ? (JSON.parse(linha.payload) as Comparativo)
        : (linha.payload as Comparativo);

    const propostas = await sql<ComparativoPropostaItem[]>`
      select id, titulo, situacao from propostas
      where id = any(${linha.proposta_ids}::uuid[])
      order by titulo asc
    `;

    return { ...linha, payload, propostas: [...propostas] };
  });
}

/**
 * Marca a comparação como apresentada e leva as propostas dela que estão
 * "em aberto" para "apresentada" (não rebaixa as já decididas).
 */
export async function apresentarComparativo(
  userId: string,
  id: string,
): Promise<void> {
  await withUser(userId, async (sql) => {
    const [c] = await sql<{ proposta_ids: string[] }[]>`
      select proposta_ids from comparativos where id = ${id}
    `;
    if (!c) return;
    await sql`
      update comparativos set
        situacao = 'apresentada',
        apresentado_em = coalesce(apresentado_em, now())
      where id = ${id}`;
    await sql`
      update propostas set
        situacao = 'apresentada',
        apresentada_em = coalesce(apresentada_em, now())
      where id = any(${c.proposta_ids}::uuid[]) and situacao = 'em_aberto'`;
  });
}

/**
 * Registra a proposta escolhida da comparação: ela vira "aprovada" e as
 * demais DESTA comparação viram "recusada". Cada comparação é independente.
 */
export async function decidirComparativo(
  userId: string,
  id: string,
  propostaEscolhidaId: string,
): Promise<void> {
  await withUser(userId, async (sql) => {
    const [c] = await sql<{ proposta_ids: string[] }[]>`
      select proposta_ids from comparativos where id = ${id}
    `;
    if (!c || !c.proposta_ids.includes(propostaEscolhidaId)) return;

    await sql`
      update comparativos set
        situacao = 'decidida',
        apresentado_em = coalesce(apresentado_em, now()),
        decidido_em = now(),
        proposta_escolhida_id = ${propostaEscolhidaId}
      where id = ${id}`;
    await sql`
      update propostas set
        situacao = 'aprovada',
        apresentada_em = coalesce(apresentada_em, now()),
        decidida_em = now()
      where id = ${propostaEscolhidaId}`;
    await sql`
      update propostas set
        situacao = 'recusada',
        apresentada_em = coalesce(apresentada_em, now()),
        decidida_em = now()
      where id = any(${c.proposta_ids}::uuid[]) and id <> ${propostaEscolhidaId}`;
  });
}

/** Reabre a comparação (desfaz a decisão) e volta as propostas dela para "apresentada". */
export async function reabrirComparativo(
  userId: string,
  id: string,
): Promise<void> {
  await withUser(userId, async (sql) => {
    const [c] = await sql<{ proposta_ids: string[] }[]>`
      select proposta_ids from comparativos where id = ${id}
    `;
    if (!c) return;
    await sql`
      update comparativos set
        situacao = 'apresentada', decidido_em = null, proposta_escolhida_id = null
      where id = ${id}`;
    await sql`
      update propostas set situacao = 'apresentada', decidida_em = null
      where id = any(${c.proposta_ids}::uuid[]) and situacao in ('aprovada', 'recusada')`;
  });
}

/**
 * Garante o deck (roteiro de apresentação) do comparativo: usa o cache em
 * disco se existir; senão, pede à IA para compor e salva. HTML, PDF e PPT
 * consomem o MESMO deck — ficam visualmente consistentes.
 * O chamador deve ter autorizado o acesso antes (via buscarComparativo).
 */
export async function garantirDeck(
  comparativoId: string,
  comparativo: Comparativo,
  empresa: string | null,
): Promise<Deck> {
  const chave = `comparativo-${comparativoId}`;
  const cache = await lerDeckCache(chave);
  if (cache) return cache;
  const { deck } = await montarDeck(comparativo, empresa);
  await salvarDeckCache(chave, deck);
  return deck;
}
