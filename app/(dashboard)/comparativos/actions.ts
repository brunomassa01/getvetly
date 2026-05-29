"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { criarComparativo } from "@/lib/comparativos/db";
import { criarPropostaComArquivos } from "@/lib/propostas/db";
import { executarAnaliseProposta } from "@/lib/propostas/analise";
import type { EstadoForm } from "@/lib/auth/tipos";

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
