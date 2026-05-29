import "server-only";
import {
  dadosParaAnalise,
  salvarAnalise,
  atualizarStatusProposta,
  aplicarAnaliseNaProposta,
} from "./db";
import { montarContexto } from "@/lib/ai/extrair";
import { analisarProposta } from "@/lib/ai/analisar";

/**
 * Pipeline completo de análise de uma proposta:
 * extrai texto → Claude → valida → salva análise → aplica na proposta → ready.
 * Atualiza o status para failed em caso de erro (com mensagem).
 */
export async function executarAnaliseProposta(
  userId: string,
  propostaId: string,
): Promise<{ ok: boolean; erro?: string }> {
  const dados = await dadosParaAnalise(userId, propostaId);
  if (!dados || dados.arquivos.length === 0) {
    await atualizarStatusProposta(
      userId,
      propostaId,
      "failed",
      "Nenhum arquivo para analisar.",
    );
    return { ok: false, erro: "Nenhum arquivo para analisar." };
  }

  await atualizarStatusProposta(userId, propostaId, "processing");
  try {
    const { contexto } = await montarContexto(dados.arquivos);
    const resultado = await analisarProposta({
      contexto,
      titulo: dados.titulo,
      categoria: dados.categoria,
      escopo: dados.escopo,
    });
    await salvarAnalise(dados.workspaceId, propostaId, resultado);
    await aplicarAnaliseNaProposta(userId, propostaId, resultado.analise);
    await atualizarStatusProposta(userId, propostaId, "ready");
    return { ok: true };
  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : "Falha na análise.";
    console.error(`[analise] proposta ${propostaId} falhou:`, erro);
    await atualizarStatusProposta(userId, propostaId, "failed", mensagem);
    return { ok: false, erro: mensagem };
  }
}
