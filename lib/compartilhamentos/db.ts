import "server-only";
import type { Sql } from "postgres";
import { withUser, getSqlService } from "@/lib/db/client";
import { garantirDeck } from "@/lib/comparativos/db";
import { garantirDeckProposta } from "@/lib/propostas/deck-plan";
import { buscarWorkspacePorId, type Workspace } from "@/lib/workspace/db";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import type { Comparativo } from "@/lib/ai/comparar-schema";
import type { Analise } from "@/lib/ai/schema";
import type { Deck } from "@/lib/comparativos/deck-schema";
import { aprovacaoSchema, type AprovacaoInput, type TipoAlvo } from "./schema";

// Props que a página pública passa para o <ApresentacaoDeck> (o mesmo
// componente usado nas telas internas de apresentação).
export interface ApresentacaoProps {
  deck: Deck;
  workspace: Workspace | null;
  criadoEm: string;
  eyebrow: string;
  subinfo?: string;
  chips: string[];
  banda: { rotulo: string; valor: string } | null;
}

export interface DecisaoRegistrada {
  revisor_nome: string;
  decisao: string;
  justificativa: string | null;
  created_at: string;
}

export interface CompartilhamentoResolvido {
  token: string;
  tipo: TipoAlvo;
  titulo: string;
  permiteAprovar: boolean;
  jaDecidido: boolean;
  apresentacao: ApresentacaoProps;
  decisao: DecisaoRegistrada | null;
}

/**
 * Gera (ou reaproveita) um link compartilhável para uma proposta ou
 * comparativo. Roda com RLS (o usuário só compartilha o que é do seu
 * workspace). Se já existe um link ativo para o mesmo alvo, reusa o token
 * em vez de criar outro.
 */
export async function criarOuReusarCompartilhamento(
  userId: string,
  alvo: { tipo: TipoAlvo; refId: string },
): Promise<{ token: string }> {
  const coluna = alvo.tipo === "proposta" ? "proposta_id" : "comparativo_id";
  return withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [ativo] = await sql<{ token: string }[]>`
      select token from compartilhamentos
      where ${sql(coluna)} = ${alvo.refId}
        and revogado_em is null and expira_em > now()
      order by created_at desc limit 1
    `;
    if (ativo) return { token: ativo.token };

    const [novo] = await sql<{ token: string }[]>`
      insert into compartilhamentos (workspace_id, criado_por, ${sql(coluna)})
      values (${membro.workspace_id}, ${userId}, ${alvo.refId})
      returning token
    `;
    return { token: novo.token };
  });
}

// Monta o deck + as props de apresentação de uma PROPOSTA (via service).
async function resolverProposta(sql: Sql, propostaId: string, empresa: string | null) {
  const [p] = await sql<
    { titulo: string; categoria: string; created_at: string; situacao: string }[]
  >`
    select titulo, categoria, created_at, situacao
    from propostas where id = ${propostaId}
  `;
  if (!p) return null;

  const [a] = await sql<{ payload: unknown }[]>`
    select payload from analises where proposta_id = ${propostaId}
    order by versao desc limit 1
  `;
  if (!a?.payload) return null;
  const analise = (
    typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload
  ) as Analise;

  const deck = await garantirDeckProposta(propostaId, analise, empresa);
  return {
    titulo: p.titulo,
    jaDecidido: p.situacao === "aprovada" || p.situacao === "recusada",
    apresentacao: {
      deck,
      criadoEm: p.created_at,
      eyebrow: "Análise de proposta",
      subinfo: ROTULO_CATEGORIA[p.categoria as Categoria] ?? undefined,
      chips: [] as string[],
      banda: { rotulo: "Fornecedor", valor: analise.fornecedor.nome },
    },
  };
}

// Monta o deck + as props de apresentação de um COMPARATIVO (via service).
async function resolverComparativo(sql: Sql, comparativoId: string, empresa: string | null) {
  const [c] = await sql<
    { titulo: string; payload: unknown; created_at: string; situacao: string }[]
  >`
    select titulo, payload, created_at, situacao
    from comparativos where id = ${comparativoId}
  `;
  if (!c) return null;
  const payload = (
    typeof c.payload === "string" ? JSON.parse(c.payload) : c.payload
  ) as Comparativo;

  const deck = await garantirDeck(comparativoId, payload, empresa);
  return {
    titulo: c.titulo,
    jaDecidido: c.situacao === "decidida",
    apresentacao: {
      deck,
      criadoEm: c.created_at,
      eyebrow: "Comparativo de propostas",
      subinfo: `${payload.propostas.length} propostas`,
      chips: payload.propostas.map((p) => p.ref),
      banda: { rotulo: "Recomendação", valor: payload.vencedor_ref },
    },
  };
}

interface LinhaCompartilhamento {
  id: string;
  workspace_id: string;
  proposta_id: string | null;
  comparativo_id: string | null;
  permite_aprovar: boolean;
  expira_em: string;
  revogado_em: string | null;
}

// Carrega o registro do link e valida que ainda está válido (não revogado /
// não expirado). Service: a leitura é restrita ao token (segredo na URL).
async function carregarShare(token: string): Promise<LinhaCompartilhamento | null> {
  const sql = getSqlService();
  const [share] = await sql<LinhaCompartilhamento[]>`
    select id, workspace_id, proposta_id, comparativo_id,
      permite_aprovar, expira_em, revogado_em
    from compartilhamentos where token = ${token}
  `;
  if (!share || share.revogado_em) return null;
  if (new Date(share.expira_em).getTime() < Date.now()) return null;
  return share;
}

/**
 * Resolve um link pelo token (rota pública /r/[token], sem login). Valida o
 * token, conta a visualização e devolve tudo pronto para renderizar o
 * relatório com whitelabel. Retorna null se o link for inválido/expirado.
 */
export async function buscarCompartilhamentoPorToken(
  token: string,
): Promise<CompartilhamentoResolvido | null> {
  const share = await carregarShare(token);
  if (!share) return null;

  const sql = getSqlService();
  await sql`
    update compartilhamentos set
      visualizacoes = visualizacoes + 1,
      primeira_visualizacao_em = coalesce(primeira_visualizacao_em, now()),
      ultima_visualizacao_em = now()
    where id = ${share.id}
  `;

  const workspace = await buscarWorkspacePorId(share.workspace_id);
  const empresa = workspace?.whitelabel_empresa_nome || workspace?.nome || null;

  const resolvido = share.proposta_id
    ? await resolverProposta(sql, share.proposta_id, empresa)
    : await resolverComparativo(sql, share.comparativo_id!, empresa);
  if (!resolvido) return null;

  const [dec] = await sql<DecisaoRegistrada[]>`
    select revisor_nome, decisao, justificativa, created_at
    from aprovacoes where compartilhamento_id = ${share.id}
    order by created_at desc limit 1
  `;

  return {
    token,
    tipo: share.proposta_id ? "proposta" : "comparativo",
    titulo: resolvido.titulo,
    permiteAprovar: share.permite_aprovar,
    jaDecidido: resolvido.jaDecidido,
    apresentacao: { workspace, ...resolvido.apresentacao },
    decisao: dec ?? null,
  };
}

/**
 * Registra a decisão de quem recebeu o link (sem login). Grava em `aprovacoes`
 * e atualiza a situação do conteúdo:
 * - proposta: aprovado(+ressalvas) → "aprovada"; recusado → "recusada".
 * - comparativo: marca como "apresentada" (a escolha da vencedora segue sendo
 *   uma decisão do dono da conta, dentro do app).
 */
export async function registrarAprovacao(
  token: string,
  input: AprovacaoInput,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const dados = aprovacaoSchema.safeParse(input);
  if (!dados.success) {
    return { ok: false, erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const share = await carregarShare(token);
  if (!share) return { ok: false, erro: "Este link não está mais disponível." };
  if (!share.permite_aprovar) {
    return { ok: false, erro: "Este link é somente para visualização." };
  }

  const sql = getSqlService();
  const { revisor_nome, revisor_email, decisao, justificativa } = dados.data;
  await sql`
    insert into aprovacoes
      (compartilhamento_id, workspace_id, revisor_nome, revisor_email,
       decisao, justificativa)
    values (${share.id}, ${share.workspace_id}, ${revisor_nome},
      ${revisor_email ?? null}, ${decisao}, ${justificativa ?? null})
  `;

  if (share.proposta_id) {
    const nova = decisao === "recusado" ? "recusada" : "aprovada";
    await sql`
      update propostas set
        situacao = ${nova},
        apresentada_em = coalesce(apresentada_em, now()),
        decidida_em = now()
      where id = ${share.proposta_id}
    `;
  } else if (share.comparativo_id) {
    await sql`
      update comparativos set
        situacao = case when situacao = 'em_aberto' then 'apresentada' else situacao end,
        apresentado_em = coalesce(apresentado_em, now())
      where id = ${share.comparativo_id}
    `;
  }

  return { ok: true };
}
