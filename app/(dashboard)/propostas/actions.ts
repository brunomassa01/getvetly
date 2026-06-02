"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioAtual } from "@/lib/auth/sessao";
import {
  criarPropostaComArquivos,
  atualizarSituacaoProposta,
  SITUACOES,
} from "@/lib/propostas/db";
import { dispararAnaliseEmSegundoPlano } from "@/lib/propostas/analise";
import { completarContatoFornecedor } from "@/lib/fornecedores/db";
import { verificarAcessoAnalise } from "@/lib/stripe/assinatura";
import { ANALISES_GRATIS } from "@/lib/stripe/config";
import type { EstadoForm } from "@/lib/auth/tipos";

const MSG_LIMITE = `Você usou suas ${ANALISES_GRATIS} análises grátis. Assine um plano na aba Financeiro (menu do seu perfil) para continuar analisando.`;

function limpar(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v ? v : null;
}

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

  const acesso = await verificarAcessoAnalise(userId);
  if (!acesso.permitido) return { erro: MSG_LIMITE };

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

  // Dispara em segundo plano e leva direto pra página (que mostra "processando").
  await dispararAnaliseEmSegundoPlano(userId, id);
  revalidatePath("/propostas");
  redirect(`/propostas/${id}`);
}

/**
 * Completa (opcional) os dados de contato do fornecedor após a análise,
 * quando a IA não conseguiu extrair. Não exige nenhum campo — o usuário
 * preenche o que quiser.
 */
export async function completarContatoFornecedorAction(
  formData: FormData,
): Promise<void> {
  const userId = await usuarioAtual();
  const fornecedorId = String(formData.get("fornecedorId") ?? "");
  const propostaId = String(formData.get("propostaId") ?? "");
  if (!fornecedorId) return;

  await completarContatoFornecedor(userId, fornecedorId, {
    cnpj: limpar(formData, "cnpj"),
    email: limpar(formData, "email"),
    telefone: limpar(formData, "telefone"),
  });
  if (propostaId) revalidatePath(`/propostas/${propostaId}`);
}

/** Atualiza a situação comercial da proposta (apresentada/aprovada/recusada/em_aberto). */
export async function marcarSituacaoAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  const situacao = String(formData.get("situacao") ?? "");
  if (!id || !SITUACOES.includes(situacao as (typeof SITUACOES)[number])) return;

  await atualizarSituacaoProposta(userId, id, situacao);
  revalidatePath(`/propostas/${id}`);
  revalidatePath("/propostas");
  revalidatePath("/painel");
}

/** Reexecuta a análise de uma proposta existente (botão "Refazer análise"). */
export async function analisarPropostaAction(formData: FormData): Promise<void> {
  const userId = await usuarioAtual();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const acesso = await verificarAcessoAnalise(userId);
  if (!acesso.permitido) redirect("/financeiro?erro=limite");
  await dispararAnaliseEmSegundoPlano(userId, id);
  revalidatePath(`/propostas/${id}`);
}
