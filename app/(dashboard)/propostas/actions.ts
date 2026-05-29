"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { criarPropostaComArquivos } from "@/lib/propostas/db";
import { executarAnaliseProposta } from "@/lib/propostas/analise";
import type { EstadoForm } from "@/lib/auth/tipos";

// Deriva um título a partir do nome do arquivo (sem extensão).
function tituloDoArquivo(nome: string): string {
  return nome.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

/**
 * Fluxo upload-first: o usuário só sobe o(s) arquivo(s). Criamos a proposta,
 * rodamos a análise (a IA extrai fornecedor, categoria, valores...) e levamos
 * direto ao relatório.
 */
export async function criarEAnalisarPropostaAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const arquivos = formData
    .getAll("arquivos")
    .filter((a): a is File => a instanceof File && a.size > 0);
  if (arquivos.length === 0) {
    return { erro: "Anexe ao menos um arquivo (PDF com texto)." };
  }

  const tituloInput = String(formData.get("titulo") ?? "").trim();
  const titulo =
    tituloInput || tituloDoArquivo(arquivos[0].name) || "Nova proposta";

  let id: string;
  try {
    const r = await criarPropostaComArquivos(userId, titulo, arquivos);
    id = r.id;
  } catch {
    return { erro: "Não foi possível salvar a proposta. Tente novamente." };
  }

  await executarAnaliseProposta(userId, id);
  revalidatePath("/propostas");
  redirect(`/propostas/${id}`);
}

/** Reexecuta a análise de uma proposta existente (botão "Refazer análise"). */
export async function analisarPropostaAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await executarAnaliseProposta(userId, id);
  revalidatePath(`/propostas/${id}`);
}
