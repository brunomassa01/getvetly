"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarAssinatura } from "@/lib/stripe/assinatura";
import { criarCheckoutSession, criarPortalSession } from "@/lib/stripe/client";
import { PLANOS, priceIdDoPlano, type Plano } from "@/lib/stripe/config";
import { buscarPerfil } from "@/lib/auth/usuarios";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Inicia a assinatura de um plano: cria o checkout no Stripe e redireciona. */
export async function assinarAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const plano = String(formData.get("plano") ?? "") as Plano;
  if (!PLANOS.includes(plano)) return;

  const priceId = priceIdDoPlano(plano);
  if (!priceId) redirect("/financeiro?erro=plano");

  const [assinatura, perfil] = await Promise.all([
    buscarAssinatura(userId),
    buscarPerfil(userId),
  ]);

  let url = "";
  try {
    const r = await criarCheckoutSession({
      priceId,
      plano,
      workspaceId: assinatura?.workspace_id ?? "",
      clienteEmail: perfil?.email ?? "",
      customerId: assinatura?.stripe_customer_id,
      successUrl: `${baseUrl()}/financeiro?sucesso=1`,
      cancelUrl: `${baseUrl()}/financeiro`,
    });
    url = r.url;
  } catch (erro) {
    console.error("[stripe] falha ao criar checkout:", erro);
    redirect("/financeiro?erro=checkout");
  }
  redirect(url);
}

/** Abre o portal do cliente do Stripe (gerenciar/cancelar). */
export async function gerenciarAssinaturaAction(): Promise<void> {
  const userId = await usuarioAtual();
  const assinatura = await buscarAssinatura(userId);
  if (!assinatura?.stripe_customer_id) redirect("/financeiro");

  let url = "";
  try {
    const r = await criarPortalSession({
      customerId: assinatura.stripe_customer_id,
      returnUrl: `${baseUrl()}/financeiro`,
    });
    url = r.url;
  } catch (erro) {
    console.error("[stripe] falha ao abrir portal:", erro);
    redirect("/financeiro?erro=portal");
  }
  redirect(url);
}
