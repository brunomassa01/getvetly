"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ehEmailInterno } from "@/lib/auth/interno";
import {
  leadSchema,
  criarLead,
  buscarLead,
  marcarConvidado,
  removerLead,
  montarLinkTeste,
} from "@/lib/admin/leads";
import { enviarEmail, emailConviteTeste } from "@/lib/email/enviar";
import { ANALISES_GRATIS } from "@/lib/stripe/config";
import type { EstadoForm } from "@/lib/auth/tipos";

// Toda ação do CRM é restrita ao admin interno (defense in depth: a tabela
// `leads` já só é acessível pelo service role, mas barramos aqui também).
async function exigirInterno(): Promise<void> {
  const session = await auth();
  if (!ehEmailInterno(session?.user?.email)) {
    throw new Error("Acesso restrito ao administrador interno.");
  }
}

/** Adiciona um novo lead ao CRM. */
export async function criarLeadAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  await exigirInterno();

  const parsed = leadSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    observacao: String(formData.get("observacao") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const r = await criarLead(parsed.data);
  if (!r.ok) return { erro: r.erro ?? "Não foi possível adicionar o lead." };

  revalidatePath("/admin/crm");
  return { sucesso: "Lead adicionado." };
}

/** Envia o convite de teste por e-mail e marca o lead como convidado. */
export async function enviarConviteEmailAction(
  id: string,
): Promise<{ ok: boolean; mensagem: string }> {
  await exigirInterno();
  if (!id) return { ok: false, mensagem: "Lead inválido." };

  const lead = await buscarLead(id);
  if (!lead) return { ok: false, mensagem: "Lead não encontrado." };

  const link = montarLinkTeste(lead.email, lead.nome);
  const { assunto, html } = emailConviteTeste({
    nome: lead.nome,
    link,
    analisesGratis: ANALISES_GRATIS,
  });

  try {
    await enviarEmail({ para: lead.email, assunto, html });
  } catch (erro) {
    console.error("[crm] falha ao enviar convite por e-mail:", erro);
    return { ok: false, mensagem: "Não consegui enviar o e-mail. Tente de novo." };
  }

  await marcarConvidado(id);
  revalidatePath("/admin/crm");
  return { ok: true, mensagem: `E-mail enviado para ${lead.email}.` };
}

/** Marca o lead como convidado (usado quando o WhatsApp é aberto). */
export async function marcarConvidadoAction(id: string): Promise<void> {
  await exigirInterno();
  if (!id) return;
  await marcarConvidado(id);
  revalidatePath("/admin/crm");
}

/** Remove um lead do CRM. */
export async function removerLeadAction(formData: FormData): Promise<void> {
  await exigirInterno();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await removerLead(id);
  revalidatePath("/admin/crm");
}
