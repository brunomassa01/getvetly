import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarComparativo } from "@/lib/comparativos/db";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { ApresentacaoComparativo } from "@/components/comparativos/ApresentacaoComparativo";
import { BotaoExportarPdf } from "@/components/BotaoExportarPdf";

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
          <a
            href={`/comparativos/${params.id}/pptx`}
            className="font-body font-semibold text-sm bg-transparent text-ink px-4 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
          >
            Baixar PPT
          </a>
          <BotaoExportarPdf />
        </div>
      </div>

      <ApresentacaoComparativo
        comparativo={comparativo.payload}
        workspace={workspace}
        titulo={comparativo.titulo}
        criadoEm={comparativo.created_at}
      />
    </div>
  );
}
