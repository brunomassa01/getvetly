"use server";

import { revalidatePath } from "next/cache";
import { registrarAprovacao } from "@/lib/compartilhamentos/db";
import { aprovacaoSchema } from "@/lib/compartilhamentos/schema";
import type { EstadoForm } from "@/lib/auth/tipos";

/**
 * Registra a decisão de quem recebeu o link (rota PÚBLICA, sem login).
 * A segurança é o token na URL — o `registrarAprovacao` revalida o token.
 */
export async function registrarAprovacaoAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { erro: "Link inválido." };

  const parsed = aprovacaoSchema.safeParse({
    revisor_nome: String(formData.get("revisor_nome") ?? ""),
    revisor_email: String(formData.get("revisor_email") ?? ""),
    decisao: String(formData.get("decisao") ?? ""),
    justificativa: String(formData.get("justificativa") ?? ""),
    proposta_aprovada_id: String(formData.get("proposta_aprovada_id") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }

  const r = await registrarAprovacao(token, parsed.data);
  if (!r.ok) return { erro: r.erro };

  revalidatePath(`/r/${token}`);
  return { sucesso: "Decisão registrada. Obrigado!" };
}
