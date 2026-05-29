"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { criarComparativo } from "@/lib/comparativos/db";
import type { EstadoForm } from "@/lib/auth/tipos";

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
