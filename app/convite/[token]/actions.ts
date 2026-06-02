"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { buscarConvitePorToken } from "@/lib/workspace/membros";
import { buscarUsuarioPorEmail, criarUsuarioNoWorkspace } from "@/lib/auth/usuarios";
import { gerarHashSenha } from "@/lib/auth/hash";
import type { EstadoForm } from "@/lib/auth/tipos";

/** Aceita o convite criando a conta DENTRO da empresa que convidou e já loga. */
export async function aceitarConviteAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const token = String(formData.get("token") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (nome.length < 2) return { erro: "Informe seu nome." };
  if (senha.length < 6) return { erro: "A senha precisa de ao menos 6 caracteres." };

  const convite = await buscarConvitePorToken(token);
  if (!convite) return { erro: "Convite inválido ou expirado." };

  const existente = await buscarUsuarioPorEmail(convite.email);
  if (existente) {
    return { erro: "Esse e-mail já tem uma conta. Faça login para continuar." };
  }

  const senhaHash = await gerarHashSenha(senha);
  try {
    await criarUsuarioNoWorkspace({
      nome,
      email: convite.email,
      senhaHash,
      workspaceId: convite.workspace_id,
      role: convite.role,
      conviteId: convite.id,
    });
  } catch {
    return { erro: "Não foi possível criar a conta. Tente novamente." };
  }

  try {
    await signIn("credentials", {
      email: convite.email,
      senha,
      redirectTo: "/painel",
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "Conta criada, mas falha ao entrar. Faça login." };
    }
    throw erro; // re-lança o redirect de sucesso
  }
  return {};
}
