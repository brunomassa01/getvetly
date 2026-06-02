"use server";

import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import {
  criarOuReusarCompartilhamento,
  marcarComoApresentado,
} from "@/lib/compartilhamentos/db";
import {
  TIPOS_ALVO,
  envioEmailSchema,
  type TipoAlvo,
} from "@/lib/compartilhamentos/schema";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { enviarEmail, emailCompartilhamento } from "@/lib/email/enviar";
import type { EstadoForm } from "@/lib/auth/tipos";

/**
 * Gera (ou reaproveita) o link público de uma proposta/comparativo e devolve
 * o caminho /r/<token>. O cliente monta a URL completa com a origem atual.
 */
export async function criarLinkCompartilhamentoAction(
  tipo: TipoAlvo,
  refId: string,
): Promise<{ ok: true; path: string } | { ok: false; erro: string }> {
  const userId = await usuarioAtual();
  if (!TIPOS_ALVO.includes(tipo) || !refId) {
    return { ok: false, erro: "Conteúdo inválido para compartilhar." };
  }
  try {
    const { token } = await criarOuReusarCompartilhamento(userId, { tipo, refId });
    return { ok: true, path: `/r/${token}` };
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof Error ? erro.message : "Falha ao gerar o link.",
    };
  }
}

/**
 * Gera/reaproveita o link e o envia por e-mail ao destinatário, marcando o
 * conteúdo como "apresentada". Usado pelo dono da conta no detalhe.
 */
export async function enviarLinkPorEmailAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const userId = await usuarioAtual();
  const tipo = String(formData.get("tipo") ?? "") as TipoAlvo;
  const refId = String(formData.get("refId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim() || "Análise";
  if (!TIPOS_ALVO.includes(tipo) || !refId) {
    return { erro: "Conteúdo inválido para compartilhar." };
  }

  const parsed = envioEmailSchema.safeParse({
    destinatario: String(formData.get("destinatario") ?? ""),
    mensagem: String(formData.get("mensagem") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }

  try {
    const { token } = await criarOuReusarCompartilhamento(userId, {
      tipo,
      refId,
      destinatarioEmail: parsed.data.destinatario,
    });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const workspace = await buscarWorkspaceDoUsuario(userId);
    const empresa = workspace?.whitelabel_empresa_nome || workspace?.nome || null;

    const { assunto, html } = emailCompartilhamento({
      link: `${base}/r/${token}`,
      empresa,
      titulo,
      mensagem: parsed.data.mensagem,
    });
    await enviarEmail({ para: parsed.data.destinatario, assunto, html });
    await marcarComoApresentado(userId, { tipo, refId });
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Não consegui enviar o e-mail.",
    };
  }

  revalidatePath(`/${tipo === "proposta" ? "propostas" : "comparativos"}/${refId}`);
  revalidatePath("/painel");
  return { sucesso: `Link enviado para ${parsed.data.destinatario} ✓` };
}
