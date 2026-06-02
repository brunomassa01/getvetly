import { NextResponse } from "next/server";
import { verificarWebhook } from "@/lib/stripe/client";
import {
  ativarAssinatura,
  atualizarAssinaturaPorCustomer,
} from "@/lib/stripe/assinatura";
import { planoDoPriceId, type Plano } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

// status do Stripe → nosso status interno
function mapearStatus(s: string): string {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

export async function POST(req: Request): Promise<Response> {
  const payload = await req.text();
  const evento = verificarWebhook(payload, req.headers.get("stripe-signature"));
  if (!evento) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 400 });
  }

  try {
    if (evento.type === "checkout.session.completed") {
      const s = evento.data.object as {
        client_reference_id?: string;
        customer?: string;
        subscription?: string;
        metadata?: { plano?: string };
      };
      const plano = (s.metadata?.plano ?? null) as Plano | null;
      if (s.client_reference_id && s.customer && s.subscription && plano) {
        await ativarAssinatura({
          workspaceId: s.client_reference_id,
          customerId: s.customer,
          subscriptionId: s.subscription,
          plano,
        });
      }
    } else if (
      evento.type === "customer.subscription.updated" ||
      evento.type === "customer.subscription.deleted"
    ) {
      const sub = evento.data.object as {
        customer?: string;
        status?: string;
        current_period_end?: number;
        items?: { data?: { price?: { id?: string } }[] };
      };
      if (sub.customer) {
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plano = priceId ? planoDoPriceId(priceId) : null;
        const expiraEm = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        const status =
          evento.type === "customer.subscription.deleted"
            ? "canceled"
            : mapearStatus(sub.status ?? "");
        await atualizarAssinaturaPorCustomer({
          customerId: sub.customer,
          status,
          plano,
          expiraEm,
        });
      }
    }
  } catch (erro) {
    console.error("[stripe-webhook] erro ao processar evento:", erro);
    return NextResponse.json({ erro: "falha interna" }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}
