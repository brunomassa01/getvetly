import "server-only";
import { withUser, getSqlService } from "@/lib/db/client";
import { encontrarOuCriarFornecedorPorNome } from "@/lib/fornecedores/db";
import { salvarArquivo } from "./storage";
import type { PropostaInput } from "./schema";
import type { Analise } from "@/lib/ai/schema";
import type { ResultadoAnalise } from "@/lib/ai/analisar";

export interface PropostaListaItem {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  valor_negociado: string | null;
  fornecedor_nome: string | null;
  created_at: string;
}

export interface PropostaArquivo {
  id: string;
  nome_original: string;
  mime_type: string;
  tamanho_bytes: number;
}

export interface PropostaDetalhe {
  id: string;
  titulo: string;
  categoria: string;
  escopo: string | null;
  aprovador_email: string | null;
  valor_tabela: string | null;
  valor_negociado: string | null;
  status: string;
  status_message: string | null;
  fornecedor_nome: string | null;
  created_at: string;
  arquivos: PropostaArquivo[];
}

/** Lista as propostas do workspace (mais recentes primeiro). */
export async function listarPropostas(
  userId: string,
): Promise<PropostaListaItem[]> {
  return withUser(userId, (sql) =>
    sql<PropostaListaItem[]>`
      select
        p.id, p.titulo, p.categoria, p.status, p.valor_negociado,
        p.created_at, f.nome as fornecedor_nome
      from propostas p
      left join fornecedores f on f.id = p.fornecedor_id
      where p.status <> 'archived'
      order by p.created_at desc
    `,
  );
}

/** Detalhe de uma proposta com seus arquivos. */
export async function buscarProposta(
  userId: string,
  id: string,
): Promise<PropostaDetalhe | null> {
  return withUser(userId, async (sql) => {
    const [proposta] = await sql<Omit<PropostaDetalhe, "arquivos">[]>`
      select
        p.id, p.titulo, p.categoria, p.escopo, p.aprovador_email,
        p.valor_tabela, p.valor_negociado, p.status, p.status_message,
        p.created_at, f.nome as fornecedor_nome
      from propostas p
      left join fornecedores f on f.id = p.fornecedor_id
      where p.id = ${id}
    `;
    if (!proposta) return null;

    const arquivos = await sql<PropostaArquivo[]>`
      select id, nome_original, mime_type, tamanho_bytes
      from proposta_arquivos
      where proposta_id = ${id}
      order by created_at asc
    `;
    return { ...proposta, arquivos: [...arquivos] };
  });
}

/**
 * Cria uma proposta (status draft) e salva os arquivos enviados.
 * A proposta é criada numa transação; os arquivos são salvos em disco e
 * registrados depois (fora da transação) para não segurá-la durante o I/O.
 */
export async function criarProposta(
  userId: string,
  dados: PropostaInput,
  arquivos: File[],
): Promise<{ id: string }> {
  const { id, workspaceId } = await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [proposta] = await sql<{ id: string }[]>`
      insert into propostas
        (workspace_id, fornecedor_id, criado_por, titulo, categoria,
         escopo, aprovador_email, valor_tabela, valor_negociado, status)
      values (
        ${membro.workspace_id},
        ${dados.fornecedor_id ?? null},
        ${userId},
        ${dados.titulo},
        ${dados.categoria},
        ${dados.escopo ?? null},
        ${dados.aprovador_email ?? null},
        ${dados.valor_tabela ?? null},
        ${dados.valor_negociado ?? null},
        'draft'
      )
      returning id
    `;
    return { id: proposta.id, workspaceId: membro.workspace_id };
  });

  for (const arquivo of arquivos) {
    if (arquivo.size === 0) continue;
    const meta = await salvarArquivo({ workspaceId, propostaId: id, arquivo });
    await withUser(userId, (sql) =>
      sql`
        insert into proposta_arquivos
          (proposta_id, workspace_id, nome_original, nome_storage,
           mime_type, tamanho_bytes)
        values (
          ${id}, ${workspaceId}, ${arquivo.name}, ${meta.nomeStorage},
          ${meta.mime}, ${meta.tamanho}
        )
      `,
    );
  }

  return { id };
}

/**
 * Cria uma proposta a partir SÓ dos arquivos (fluxo upload-first).
 * Categoria nasce 'outro' e status 'processing' — a IA preenche o resto.
 */
export async function criarPropostaComArquivos(
  userId: string,
  titulo: string,
  arquivos: File[],
): Promise<{ id: string }> {
  const { id, workspaceId } = await withUser(userId, async (sql) => {
    const [membro] = await sql<{ workspace_id: string }[]>`
      select workspace_id from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    if (!membro) throw new Error("Usuário sem workspace ativo.");

    const [proposta] = await sql<{ id: string }[]>`
      insert into propostas
        (workspace_id, criado_por, titulo, categoria, status)
      values (${membro.workspace_id}, ${userId}, ${titulo}, 'outro', 'processing')
      returning id
    `;
    return { id: proposta.id, workspaceId: membro.workspace_id };
  });

  for (const arquivo of arquivos) {
    if (arquivo.size === 0) continue;
    const meta = await salvarArquivo({ workspaceId, propostaId: id, arquivo });
    await withUser(userId, (sql) =>
      sql`
        insert into proposta_arquivos
          (proposta_id, workspace_id, nome_original, nome_storage,
           mime_type, tamanho_bytes)
        values (
          ${id}, ${workspaceId}, ${arquivo.name}, ${meta.nomeStorage},
          ${meta.mime}, ${meta.tamanho}
        )
      `,
    );
  }
  return { id };
}

/**
 * Aplica o resultado da IA na proposta: atualiza categoria/escopo/valores e
 * vincula (cria se preciso) o fornecedor extraído, com contato.
 */
export async function aplicarAnaliseNaProposta(
  userId: string,
  propostaId: string,
  analise: Analise,
): Promise<void> {
  let fornecedorId: string | null = null;
  if (analise.fornecedor?.nome) {
    fornecedorId = await encontrarOuCriarFornecedorPorNome(userId, {
      nome: analise.fornecedor.nome,
      cnpj: analise.fornecedor.cnpj,
      email: analise.fornecedor.contato?.email ?? null,
      telefone: analise.fornecedor.contato?.telefone ?? null,
      segmento: analise.proposta.categoria,
    });
  }

  const v = analise.valores;
  await withUser(userId, (sql) =>
    sql`
      update propostas set
        categoria = ${analise.proposta.categoria},
        escopo = coalesce(${analise.proposta.escopo}, escopo),
        valor_tabela = coalesce(${v.tabela_total}, valor_tabela),
        valor_negociado = coalesce(${v.negociado_total}, valor_negociado),
        desconto_pct = ${v.desconto_pct},
        economia = ${v.economia},
        fornecedor_id = coalesce(fornecedor_id, ${fornecedorId})
      where id = ${propostaId}
    `,
  );
}

// ===================== Análise por IA =====================

export interface DadosParaAnalise {
  workspaceId: string;
  titulo: string;
  categoria: string;
  escopo: string | null;
  arquivos: {
    nome_original: string;
    nome_storage: string;
    mime_type: string;
  }[];
}

/** Reúne os dados necessários para rodar a análise (RLS garante ownership). */
export async function dadosParaAnalise(
  userId: string,
  propostaId: string,
): Promise<DadosParaAnalise | null> {
  return withUser(userId, async (sql) => {
    const [proposta] = await sql<
      { workspace_id: string; titulo: string; categoria: string; escopo: string | null }[]
    >`
      select workspace_id, titulo, categoria, escopo
      from propostas where id = ${propostaId}
    `;
    if (!proposta) return null;

    const arquivos = await sql<
      { nome_original: string; nome_storage: string; mime_type: string }[]
    >`
      select nome_original, nome_storage, mime_type
      from proposta_arquivos where proposta_id = ${propostaId}
      order by created_at asc
    `;

    return {
      workspaceId: proposta.workspace_id,
      titulo: proposta.titulo,
      categoria: proposta.categoria,
      escopo: proposta.escopo,
      arquivos: [...arquivos],
    };
  });
}

/** Atualiza o status da proposta (criador ou admin via RLS). */
export async function atualizarStatusProposta(
  userId: string,
  propostaId: string,
  status: string,
  mensagem?: string,
): Promise<void> {
  await withUser(userId, (sql) =>
    sql`
      update propostas
      set status = ${status}, status_message = ${mensagem ?? null}
      where id = ${propostaId}
    `,
  );
}

/**
 * Salva a análise gerada pela IA. Usa a conexão de SERVIÇO (BYPASSRLS),
 * pois a tabela analises não tem policy de insert (worker confiável).
 */
export async function salvarAnalise(
  workspaceId: string,
  propostaId: string,
  resultado: ResultadoAnalise,
): Promise<void> {
  const sql = getSqlService();
  await sql`
    insert into analises
      (proposta_id, workspace_id, versao, payload, modelo_usado,
       prompt_versao, tokens_input, tokens_output, custo_usd, latencia_ms)
    values (
      ${propostaId}, ${workspaceId}, 1,
      ${JSON.stringify(resultado.analise)}::jsonb,
      ${resultado.modelo}, ${resultado.promptVersao},
      ${resultado.tokensInput}, ${resultado.tokensOutput},
      ${resultado.custoUsd}, ${resultado.latenciaMs}
    )
    on conflict (proposta_id, versao) do update set
      payload = excluded.payload,
      modelo_usado = excluded.modelo_usado,
      tokens_input = excluded.tokens_input,
      tokens_output = excluded.tokens_output,
      custo_usd = excluded.custo_usd,
      latencia_ms = excluded.latencia_ms,
      created_at = now()
  `;
}

/** Busca a análise mais recente de uma proposta (RLS select por membro). */
export async function buscarAnalise(
  userId: string,
  propostaId: string,
): Promise<Analise | null> {
  return withUser(userId, async (sql) => {
    const [linha] = await sql<{ payload: Analise }[]>`
      select payload from analises
      where proposta_id = ${propostaId}
      order by versao desc limit 1
    `;
    return linha?.payload ?? null;
  });
}
