"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { propostaSchema } from "@/lib/propostas/schema";
import {
  criarProposta,
  dadosParaAnalise,
  atualizarStatusProposta,
  salvarAnalise,
} from "@/lib/propostas/db";
import { montarContexto } from "@/lib/ai/extrair";
import { analisarProposta } from "@/lib/ai/analisar";
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

/** Dispara a análise por IA de uma proposta (síncrono no MVP). */
export async function analisarPropostaAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const dados = await dadosParaAnalise(userId, id);
  if (!dados || dados.arquivos.length === 0) {
    await atualizarStatusProposta(
      userId,
      id,
      "failed",
      "Nenhum arquivo para analisar.",
    );
    revalidatePath(`/propostas/${id}`);
    return;
  }

  await atualizarStatusProposta(userId, id, "processing");
  try {
    const { contexto } = await montarContexto(dados.arquivos);
    const resultado = await analisarProposta({
      contexto,
      titulo: dados.titulo,
      categoria: dados.categoria,
      escopo: dados.escopo,
    });
    await salvarAnalise(dados.workspaceId, id, resultado);
    await atualizarStatusProposta(userId, id, "ready");
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha na análise.";
    await atualizarStatusProposta(userId, id, "failed", mensagem);
  }
  revalidatePath(`/propostas/${id}`);
}
