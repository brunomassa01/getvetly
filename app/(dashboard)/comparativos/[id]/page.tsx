import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarComparativo } from "@/lib/comparativos/db";
import { formatarData } from "@/lib/format";
import { RelatorioComparativo } from "@/components/comparativos/RelatorioComparativo";
import { SituacaoComparativo } from "@/components/comparativos/SituacaoComparativo";
import { BotaoGerarApresentacao } from "@/components/BotaoGerarApresentacao";
import { WhitelabelHeader } from "@/components/WhitelabelHeader";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";

export const metadata: Metadata = { title: "Comparativo — Vetly" };
export const dynamic = "force-dynamic";

export default async function ComparativoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await usuarioAtual();
  const comparativo = await buscarComparativo(userId, params.id);
  if (!comparativo) notFound();
  const workspace = await buscarWorkspaceDoUsuario(userId);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <WhitelabelHeader workspace={workspace} />
      <div>
        <Link
          href="/comparativos"
          className="print:hidden text-sm text-texto-2 hover:text-ink"
        >
          ← Voltar
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
              {comparativo.titulo}
            </h1>
            <p className="text-sm text-texto-3 mt-1">
              Criado em {formatarData(comparativo.created_at)}
            </p>
          </div>
          <div className="shrink-0">
            <BotaoGerarApresentacao
              href={`/comparativos/${params.id}/apresentacao`}
            />
          </div>
        </div>
      </div>

      <SituacaoComparativo
        id={comparativo.id}
        situacao={comparativo.situacao}
        apresentadoEm={comparativo.apresentado_em}
        decididoEm={comparativo.decidido_em}
        propostaEscolhidaId={comparativo.proposta_escolhida_id}
        propostas={comparativo.propostas}
      />

      <RelatorioComparativo comparativo={comparativo.payload} />
    </div>
  );
}
