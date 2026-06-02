import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.stripe.com/v1";

function chaveSecreta(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("STRIPE_SECRET_KEY não configurada no servidor.");
  return k;
}

// POST form-urlencoded para a API do Stripe. Genérico p/ tipar o retorno.
async function stripePost<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const resp = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chaveSecreta()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await resp.json()) as T & { error?: { message?: string } };
  if (!resp.ok) {
    throw new Error(`Stripe ${resp.status}: ${json?.error?.message ?? "erro"}`);
  }
  return json;
}

/** Cria uma sessão de checkout (assinatura) e devolve a URL do Stripe. */
export async function criarCheckoutSession(input: {
  priceId: string;
  workspaceId: string;
  plano: string;
  clienteEmail: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: input.workspaceId,
    "metadata[workspace_id]": input.workspaceId,
    "metadata[plano]": input.plano,
    "subscription_data[metadata][workspace_id]": input.workspaceId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: "true",
  };
  if (input.customerId) params.customer = input.customerId;
  else params.customer_email = input.clienteEmail;

  const { url } = await stripePost<{ url: string }>("/checkout/sessions", params);
  return { url };
}

/** Cria uma sessão do portal do cliente (gerenciar/cancelar assinatura). */
export async function criarPortalSession(input: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const { url } = await stripePost<{ url: string }>("/billing_portal/sessions", {
    customer: input.customerId,
    return_url: input.returnUrl,
  });
  return { url };
}

// Evento mínimo do Stripe que o webhook consome.
export interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

/**
 * Verifica a assinatura do webhook (header Stripe-Signature) com HMAC-SHA256,
 * sem SDK. Retorna o evento parseado ou null se a assinatura não bater.
 */
export function verificarWebhook(
  payload: string,
  assinaturaHeader: string | null,
): StripeEvent | null {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo || !assinaturaHeader) return null;

  const partes: Record<string, string> = {};
  for (const item of assinaturaHeader.split(",")) {
    const idx = item.indexOf("=");
    if (idx > 0) partes[item.slice(0, idx)] = item.slice(idx + 1);
  }
  const t = partes["t"];
  const v1 = partes["v1"];
  if (!t || !v1) return null;

  const esperado = createHmac("sha256", segredo)
    .update(`${t}.${payload}`)
    .digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    return null;
  }
}
