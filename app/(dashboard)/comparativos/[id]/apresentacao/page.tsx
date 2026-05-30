import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarComparativo, garantirDeck } from "@/lib/comparativos/db";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { ApresentacaoDeck } from "@/components/comparativos/ApresentacaoDeck";
import { BotaoExportarPdf } from "@/components/BotaoExportarPdf";
import { BotaoBaixarPpt } from "@/components/comparativos/BotaoBaixarPpt";

export const metadata: Metadata = { title: "Apresentação — Vetly" };
export const dynamic = "force-dynamic";

export default async function ApresentacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await usuarioAtual();
  const comparativo = await buscarComparativo(userId, params.id);
  if (!comparativo) notFound();
  const workspace = await buscarWorkspaceDoUsuario(userId);
  const empresa = workspace?.whitelabel_empresa_nome || workspace?.nome || null;

  // A IA compõe o roteiro (uma vez) — HTML, PDF e PPT usam o mesmo.
  const deck = await garantirDeck(params.id, comparativo.payload, empresa);

  return (
    <div>
      {/* Barra de ação (não sai no PDF) */}
      <div className="print:hidden flex items-center justify-between gap-4 mb-6">
        <Link
          href={`/comparativos/${params.id}`}
          className="text-sm text-texto-2 hover:text-ink"
        >
          ← Voltar
        </Link>
        <div className="flex gap-2">
          <BotaoBaixarPpt comparativoId={params.id} />
          <BotaoExportarPdf />
        </div>
      </div>

      <ApresentacaoDeck
        deck={deck}
        workspace={workspace}
        criadoEm={comparativo.created_at}
        propostasRefs={comparativo.payload.propostas.map((p) => p.ref)}
        vencedorRef={comparativo.payload.vencedor_ref}
      />
    </div>
  );
}
