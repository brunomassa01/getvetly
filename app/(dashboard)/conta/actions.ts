"use server";

import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { atualizarPerfil, salvarAvatarPerfil } from "@/lib/auth/usuarios";
import { salvarAvatar } from "@/lib/auth/avatar";
import type { EstadoForm } from "@/lib/auth/tipos";

export async function atualizarPerfilAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (nome.length < 2) {
    return { erro: "Informe seu nome." };
  }

  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      const caminho = await salvarAvatar(userId, foto);
      await salvarAvatarPerfil(userId, caminho);
    } catch (erro) {
      return {
        erro: erro instanceof Error ? erro.message : "Falha ao salvar a foto.",
      };
    }
  }

  await atualizarPerfil(userId, {
    nome,
    telefone: telefone || null,
  });

  revalidatePath("/conta");
  revalidatePath("/painel");
  return { sucesso: "Perfil atualizado." };
}
