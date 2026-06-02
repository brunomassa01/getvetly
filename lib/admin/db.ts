import "server-only";
import { getSqlService } from "@/lib/db/client";
import { PRECO_MENSAL_BRL, type Plano } from "@/lib/stripe/config";

export interface MetricasAdmin {
  workspaces: number;
  ativos: number;
  trials: number;
  cancelados: number;
  assinantesPorPlano: { plano: string; n: number }[];
  mrr: number; // R$/mês (exclui Enterprise, sob consulta)
  enterpriseAtivos: number;
  usuarios: number;
  analises: number;
  custoIaUsd: number;
  propostas: number;
  comparativos: number;
  recentes: {
    nome: string;
    status: string;
    plano: string | null;
    created_at: string;
  }[];
}

/** Métricas globais do negócio (todos os workspaces). Service = ignora RLS. */
export async function metricasAdmin(): Promise<MetricasAdmin> {
  const sql = getSqlService();

  const status = await sql<{ status: string; n: number }[]>`
    select assinatura_status as status, count(*)::int as n
    from workspaces group by assinatura_status
  `;
  const porStatus = (s: string) =>
    status.find((x) => x.status === s)?.n ?? 0;

  const planos = await sql<{ plano: string; n: number }[]>`
    select plano, count(*)::int as n from workspaces
    where assinatura_status = 'active' and plano is not null
    group by plano
  `;
  const mrr = planos.reduce(
    (soma, p) => soma + p.n * (PRECO_MENSAL_BRL[p.plano as Plano] ?? 0),
    0,
  );
  const enterpriseAtivos = planos.find((p) => p.plano === "enterprise")?.n ?? 0;

  const [usuarios] = await sql<{ n: number }[]>`select count(*)::int as n from auth.users`;
  const [ana] = await sql<{ n: number; custo: string }[]>`
    select count(*)::int as n, coalesce(sum(custo_usd), 0) as custo from analises
  `;
  const [prop] = await sql<{ n: number }[]>`select count(*)::int as n from propostas`;
  const [comp] = await sql<{ n: number }[]>`select count(*)::int as n from comparativos`;
  const [ws] = await sql<{ n: number }[]>`select count(*)::int as n from workspaces`;

  const recentes = await sql<
    { nome: string; status: string; plano: string | null; created_at: string }[]
  >`
    select nome, assinatura_status as status, plano, created_at
    from workspaces order by created_at desc limit 8
  `;

  return {
    workspaces: ws?.n ?? 0,
    ativos: porStatus("active"),
    trials: porStatus("trial"),
    cancelados: porStatus("canceled"),
    assinantesPorPlano: [...planos],
    mrr,
    enterpriseAtivos,
    usuarios: usuarios?.n ?? 0,
    analises: ana?.n ?? 0,
    custoIaUsd: Number(ana?.custo ?? 0),
    propostas: prop?.n ?? 0,
    comparativos: comp?.n ?? 0,
    recentes: [...recentes],
  };
}
