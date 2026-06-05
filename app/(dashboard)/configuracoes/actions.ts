"use server";

import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import { workspaceSchema } from "@/lib/workspace/schema";
import { atualizarWorkspace, salvarLogoWorkspace } from "@/lib/workspace/db";
import { salvarDesignSystemWorkspace } from "@/lib/workspace/design-system";
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
    whitelabel_cor_secundaria: String(
      formData.get("whitelabel_cor_secundaria") ?? "",
    ),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // 1) Dados principais (nome, CNPJ, segmento, porte, cores). Se ISTO falhar,
  //    é erro de verdade — nada foi salvo, então avisamos e paramos.
  try {
    await atualizarWorkspace(userId, parsed.data);
  } catch (erro) {
    console.error("[configuracoes] falha ao salvar dados da empresa:", erro);
    return {
      erro: "Não consegui salvar os dados da empresa. Tente novamente.",
    };
  }

  // A partir daqui os dados principais JÁ estão salvos. Os uploads abaixo são
  // opcionais e NUNCA derrubam o que já foi salvo — no máximo viram um aviso.
  const avisos: string[] = [];

  // Logo (opcional)
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      await salvarLogoWorkspace(userId, logo);
    } catch (erro) {
      console.error("[configuracoes] falha ao salvar o logo:", erro);
      avisos.push(
        erro instanceof Error
          ? `O logo não foi salvo (${erro.message}).`
          : "O logo não foi salvo.",
      );
    }
  }

  // Arquivo de marca (opcional) — PDF do manual ou texto; a IA extrai as cores.
  const design = formData.get("design_md");
  let coresDoArquivo = false;
  if (design instanceof File && design.size > 0) {
    try {
      const r = await salvarDesignSystemWorkspace(userId, design);
      coresDoArquivo = r.coresAtualizadas;
    } catch (erro) {
      console.error("[configuracoes] falha ao ler o arquivo de marca:", erro);
      avisos.push(
        erro instanceof Error
          ? erro.message
          : "Não consegui ler o arquivo de marca.",
      );
    }
  }

  revalidatePath("/configuracoes");
  revalidatePath("/painel");

  let sucesso = "Dados da empresa salvos.";
  if (coresDoArquivo) {
    sucesso += " As cores foram ajustadas a partir do arquivo de marca.";
  }
  if (avisos.length > 0) {
    sucesso += ` Atenção: ${avisos.join(" ")}`;
  }
  return { sucesso };
}
