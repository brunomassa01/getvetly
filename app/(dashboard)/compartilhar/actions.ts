"use server";

import { usuarioAtual } from "@/lib/auth/sessao";
import { criarOuReusarCompartilhamento } from "@/lib/compartilhamentos/db";
import { TIPOS_ALVO, type TipoAlvo } from "@/lib/compartilhamentos/schema";

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
