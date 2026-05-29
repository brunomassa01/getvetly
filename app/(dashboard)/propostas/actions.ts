"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { propostaSchema } from "@/lib/propostas/schema";
import { criarProposta } from "@/lib/propostas/db";
import type { EstadoForm } from "@/lib/auth/tipos";

export async function criarPropostaAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const parsed = propostaSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    fornecedor_id: String(formData.get("fornecedor_id") ?? ""),
    categoria: String(formData.get("categoria") ?? ""),
    escopo: String(formData.get("escopo") ?? ""),
    aprovador_email: String(formData.get("aprovador_email") ?? ""),
    valor_tabela: String(formData.get("valor_tabela") ?? ""),
    valor_negociado: String(formData.get("valor_negociado") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const arquivos = formData
    .getAll("arquivos")
    .filter((a): a is File => a instanceof File && a.size > 0);

  let id: string;
  try {
    const resultado = await criarProposta(userId, parsed.data, arquivos);
    id = resultado.id;
  } catch {
    return { erro: "Não foi possível criar a proposta. Tente novamente." };
  }

  revalidatePath("/propostas");
  redirect(`/propostas/${id}`);
}
