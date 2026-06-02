"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import {
  criarComparativo,
  apresentarComparativo,
  decidirComparativo,
  reabrirComparativo,
} from "@/lib/comparativos/db";
import { criarPropostaComArquivos } from "@/lib/propostas/db";
import { executarAnaliseProposta } from "@/lib/propostas/analise";
import { verificarAcessoAnalise } from "@/lib/stripe/assinatura";
import { ANALISES_GRATIS } from "@/lib/stripe/config";
import type { EstadoForm } from "@/lib/auth/tipos";

// Revalida todas as telas afetadas por uma decisão de comparação.
function revalidarTudo(id: string) {
  revalidatePath(`/comparativos/${id}`);
  revalidatePath("/comparativos");
  revalidatePath("/propostas");
  revalidatePath("/painel");
}

function tituloDoArquivo(nome: string): string {
  return nome.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Proposta";
}

export async function gerarComparativoAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const propostaIds = formData
    .getAll("propostas")
    .map(String)
    .filter(Boolean);
  const criterios = String(formData.get("criterios") ?? "");
  const tituloInput = String(formData.get("titulo") ?? "").trim();

  if (propostaIds.length < 2) {
    return { erro: "Selecione ao menos 2 propostas para comparar." };
  }

  const titulo =
    tituloInput || `Comparativo de ${propostaIds.length} propostas`;

  let id: string;
  try {
    const r = await criarComparativo(userId, { titulo, propostaIds, criterios });
    id = r.id;
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Falha ao gerar comparação.",
    };
  }

  revalidatePath("/comparativos");
  redirect(`/comparativos/${id}`);
}

/** Marca a comparação como apresentada (cascata pras propostas em aberto). */
export async function apresentarComparativoAction(
  formData: FormData,
): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apresentarComparativo(userId, id);
  revalidarTudo(id);
}

/** Registra a proposta escolhida da comparação (aprova ela, recusa as demais). */
export async function decidirComparativoAction(
  formData: FormData,
): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  const propostaEscolhidaId = String(formData.get("proposta_escolhida_id") ?? "");
  if (!id || !propostaEscolhidaId) return;
  await decidirComparativo(userId, id, propostaEscolhidaId);
  revalidarTudo(id);
}

/** Reabre a comparação (desfaz a decisão). */
export async function reabrirComparativoAction(
  formData: FormData,
): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await reabrirComparativo(userId, id);
  revalidarTudo(id);
}

/**
 * Sobe vários arquivos (1 por fornecedor), cria uma proposta para cada,
 * analisa todas e já gera a comparação. Fluxo "subir e comparar".
 */
export async function compararNovosArquivosAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();

  const arquivos = formData
    .getAll("arquivos")
    .filter((a): a is File => a instanceof File && a.size > 0);
  const criterios = String(formData.get("criterios") ?? "");

  if (arquivos.length < 2) {
    return {
      erro: "Suba ao menos 2 propostas (1 arquivo por fornecedor).",
    };
  }

  const acesso = await verificarAcessoAnalise(userId);
  if (!acesso.permitido) {
    return {
      erro: `Você usou suas ${ANALISES_GRATIS} análises grátis. Assine um plano na aba Financeiro para continuar.`,
    };
  }

  const idsProntos: string[] = [];
  for (const arquivo of arquivos) {
    try {
      const { id } = await criarPropostaComArquivos(
        userId,
        tituloDoArquivo(arquivo.name),
        [arquivo],
      );
      const r = await executarAnaliseProposta(userId, id);
      if (r.ok) idsProntos.push(id);
    } catch {
      // ignora um arquivo que falhe; segue com os demais
    }
  }

  if (idsProntos.length < 2) {
    return {
      erro: "Não consegui analisar ao menos 2 propostas. Verifique se os PDFs têm texto.",
    };
  }

  let compId: string;
  try {
    const c = await criarComparativo(userId, {
      titulo: `Comparativo de ${idsProntos.length} propostas`,
      propostaIds: idsProntos,
      criterios,
    });
    compId = c.id;
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Falha ao gerar comparação.",
    };
  }

  revalidatePath("/comparativos");
  redirect(`/comparativos/${compId}`);
}
