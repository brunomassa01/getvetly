import "server-only";
import { withUser, getSqlService } from "@/lib/db/client";
import { ANALISES_GRATIS, type Plano } from "./config";

export interface Assinatura {
  workspace_id: string;
  plano: string | null;
  status: string; // trial | active | past_due | canceled
  expira_em: string | null;
  stripe_customer_id: string | null;
}

/** E-mails internos (Bruno/equipe) que não passam pela cobrança. */
function ehAdminInterno(email: string | null): boolean {
  if (!email) return false;
  const lista = (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

/** Assinatura do workspace do usuário logado (via RLS). */
export async function buscarAssinatura(userId: string): Promise<Assinatura | null> {
  return withUser(userId, async (sql) => {
    const [w] = await sql<Assinatura[]>`
      select w.id as workspace_id, w.plano, w.assinatura_status as status,
        w.assinatura_expira_em as expira_em, w.stripe_customer_id
      from workspaces w
      join workspace_members m on m.workspace_id = w.id
      where m.user_id = ${userId} and m.ativo = true
      limit 1
    `;
    return w ?? null;
  });
}

export interface AcessoAnalise {
  permitido: boolean;
  status: string;
  usadas: number;
  restantes: number; // -1 = ilimitado (assinante ou admin interno)
}

/**
 * Pode rodar uma análise? Admin interno e assinante ativo → sempre. Senão,
 * vale o teste grátis (ANALISES_GRATIS análises por workspace).
 */
export async function verificarAcessoAnalise(userId: string): Promise<AcessoAnalise> {
  return withUser(userId, async (sql) => {
    const [w] = await sql<{ workspace_id: string; status: string; email: string }[]>`
      select m.workspace_id, w.assinatura_status as status, u.email
      from workspace_members m
      join workspaces w on w.id = m.workspace_id
      join auth.users u on u.id = m.user_id
      where m.user_id = ${userId} and m.ativo = true
      limit 1
    `;
    if (!w) return { permitido: false, status: "none", usadas: 0, restantes: 0 };
    if (ehAdminInterno(w.email)) {
      return { permitido: true, status: "admin", usadas: 0, restantes: -1 };
    }
    if (w.status === "active") {
      return { permitido: true, status: "active", usadas: 0, restantes: -1 };
    }
    const [c] = await sql<{ n: number }[]>`
      select count(*)::int as n from analises where workspace_id = ${w.workspace_id}
    `;
    const usadas = c?.n ?? 0;
    const restantes = Math.max(0, ANALISES_GRATIS - usadas);
    return { permitido: restantes > 0, status: w.status, usadas, restantes };
  });
}

// ---------- Service (webhook do Stripe) ----------

/** Ativa a assinatura quando o checkout é concluído. */
export async function ativarAssinatura(input: {
  workspaceId: string;
  customerId: string;
  subscriptionId: string;
  plano: Plano;
}): Promise<void> {
  const sql = getSqlService();
  await sql`
    update workspaces set
      stripe_customer_id = ${input.customerId},
      stripe_subscription_id = ${input.subscriptionId},
      plano = ${input.plano},
      assinatura_status = 'active'
    where id = ${input.workspaceId}
  `;
}

/** Atualiza status/plano/validade a partir de eventos da assinatura. */
export async function atualizarAssinaturaPorCustomer(input: {
  customerId: string;
  status: string;
  plano: Plano | null;
  expiraEm: string | null;
}): Promise<void> {
  const sql = getSqlService();
  await sql`
    update workspaces set
      assinatura_status = ${input.status},
      plano = coalesce(${input.plano}, plano),
      assinatura_expira_em = ${input.expiraEm}
    where stripe_customer_id = ${input.customerId}
  `;
}
