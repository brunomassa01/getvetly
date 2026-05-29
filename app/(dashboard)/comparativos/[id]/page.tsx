import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarComparativo } from "@/lib/comparativos/db";
import { formatarData } from "@/lib/format";
import { RelatorioComparativo } from "@/components/comparativos/RelatorioComparativo";

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/comparativos"
          className="text-sm text-texto-2 hover:text-ink"
        >
          ← Voltar
        </Link>
        <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2">
          {comparativo.titulo}
        </h1>
        <p className="text-sm text-texto-3 mt-1">
          Criado em {formatarData(comparativo.created_at)}
        </p>
      </div>

      <RelatorioComparativo comparativo={comparativo.payload} />
    </div>
  );
}
