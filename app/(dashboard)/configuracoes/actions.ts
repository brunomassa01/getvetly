"use server";

import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { workspaceSchema } from "@/lib/workspace/schema";
import { atualizarWorkspace } from "@/lib/workspace/db";
import type { EstadoForm } from "@/lib/auth/tipos";

export async function salvarConfiguracoesAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const parsed = workspaceSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    segmento: String(formData.get("segmento") ?? ""),
    tamanho: String(formData.get("tamanho") ?? ""),
    whitelabel_empresa_nome: String(
      formData.get("whitelabel_empresa_nome") ?? "",
    ),
    whitelabel_cor_primaria: String(
      formData.get("whitelabel_cor_primaria") ?? "",
    ),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await atualizarWorkspace(userId, parsed.data);
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Falha ao salvar.",
    };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/painel");
  return { sucesso: "Dados da empresa salvos." };
}
