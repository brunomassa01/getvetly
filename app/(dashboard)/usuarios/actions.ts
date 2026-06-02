"use server";

import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarPerfil } from "@/lib/auth/usuarios";
import {
  criarConvite,
  removerMembro,
  revogarConvite,
} from "@/lib/workspace/membros";
import { enviarEmail, emailConvite } from "@/lib/email/enviar";
import type { EstadoForm } from "@/lib/auth/tipos";

export async function convidarAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";

  const r = await criarConvite(userId, email, role);
  if (!r.ok || !r.token) {
    return { erro: r.erro ?? "Não foi possível convidar." };
  }

  // Envia o e-mail com o link de aceite.
  const perfil = await buscarPerfil(userId);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${base}/convite/${r.token}`;
  const { assunto, html } = emailConvite({
    link,
    empresa: r.workspaceNome ?? "a empresa",
    convidadoPor: perfil?.nome ?? null,
  });
  try {
    await enviarEmail({ para: email.trim().toLowerCase(), assunto, html });
  } catch {
    // convite criado; e-mail pode ter falhado — o link ainda funciona
  }

  revalidatePath("/usuarios");
  return { sucesso: `Convite enviado para ${email.trim().toLowerCase()}.` };
}

export async function removerMembroAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await removerMembro(userId, id);
    revalidatePath("/usuarios");
  }
}

export async function revogarConviteAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await revogarConvite(userId, id);
    revalidatePath("/usuarios");
  }
}
