"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { fornecedorSchema } from "@/lib/fornecedores/schema";
import {
  criarFornecedor,
  atualizarFornecedor,
  arquivarFornecedor,
} from "@/lib/fornecedores/db";
import type { EstadoForm } from "@/lib/auth/tipos";

function extrairDados(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    segmento: String(formData.get("segmento") ?? ""),
    observacoes: String(formData.get("observacoes") ?? ""),
  };
}

export async function criarFornecedorAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();
  const parsed = fornecedorSchema.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await criarFornecedor(userId, parsed.data);
  revalidatePath("/fornecedores");
  redirect("/fornecedores");
}

export async function atualizarFornecedorAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Fornecedor não informado." };

  const parsed = fornecedorSchema.safeParse(extrairDados(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await atualizarFornecedor(userId, id, parsed.data);
  revalidatePath("/fornecedores");
  redirect("/fornecedores");
}

export async function arquivarFornecedorAction(
  formData: FormData,
): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await arquivarFornecedor(userId, id);
    revalidatePath("/fornecedores");
  }
}
