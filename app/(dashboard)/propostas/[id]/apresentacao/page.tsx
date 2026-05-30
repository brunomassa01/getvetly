import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarProposta, buscarAnalise } from "@/lib/propostas/db";
import { garantirDeckProposta } from "@/lib/propostas/deck-plan";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { ApresentacaoDeck } from "@/components/comparativos/ApresentacaoDeck";
import { BotaoExportarPdf } from "@/components/BotaoExportarPdf";
import { BotaoBaixarPpt } from "@/components/comparativos/BotaoBaixarPpt";

export const metadata: Metadata = { title: "Apresentação — Vetly" };
export const dynamic = "force-dynamic";

export default async function ApresentacaoPropostaPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await usuarioAtual();
  const proposta = await buscarProposta(userId, params.id);
  if (!proposta) notFound();
  const analise = await buscarAnalise(userId, params.id);
  if (!analise) redirect(`/propostas/${params.id}`);

  const workspace = await buscarWorkspaceDoUsuario(userId);
  const empresa = workspace?.whitelabel_empresa_nome || workspace?.nome || null;

  const deck = await garantirDeckProposta(params.id, analise, empresa);

  return (
    <div>
      <div className="print:hidden flex items-center justify-between gap-4 mb-6">
        <Link
          href={`/propostas/${params.id}`}
          className="text-sm text-texto-2 hover:text-ink"
        >
          ← Voltar
        </Link>
        <div className="flex gap-2">
          <BotaoBaixarPpt url={`/propostas/${params.id}/pptx`} />
          <BotaoExportarPdf />
        </div>
      </div>

      <ApresentacaoDeck
        deck={deck}
        workspace={workspace}
        criadoEm={proposta.created_at}
        eyebrow="Análise de proposta"
        subinfo={ROTULO_CATEGORIA[proposta.categoria as Categoria] ?? undefined}
        banda={{ rotulo: "Fornecedor", valor: analise.fornecedor.nome }}
      />
    </div>
  );
}
