import type { Metadata } from "next";
import Link from "next/link";
import { usuarioAtual } from "@/lib/auth/sessao";
import { listarPropostasProntas } from "@/lib/comparativos/db";
import { ComparativoForm } from "@/components/comparativos/ComparativoForm";

export const metadata: Metadata = { title: "Nova comparação — Vetly" };
export const dynamic = "force-dynamic";

export default async function NovaComparacaoPage() {
  const userId = await usuarioAtual();
  const propostas = await listarPropostasProntas(userId);

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/comparativos" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-2">
        Nova comparação
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Escolha as propostas e diga o que mais importa — a IA recomenda a melhor.
      </p>

      {propostas.length < 2 ? (
        <div className="text-center py-16 border border-dashed border-[color:var(--border-default)] rounded-xl">
          <p className="font-display font-bold text-ink">
            Você precisa de pelo menos 2 propostas analisadas
          </p>
          <p className="text-sm text-texto-2 mt-1 mb-6">
            Analise mais propostas (status &quot;Pronta&quot;) para poder
            comparar.
          </p>
          <Link
            href="/propostas/nova"
            className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
          >
            Nova proposta
          </Link>
        </div>
      ) : (
        <ComparativoForm propostas={propostas} />
      )}
    </div>
  );
}
