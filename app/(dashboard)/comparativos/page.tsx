import type { Metadata } from "next";
import Link from "next/link";
import { usuarioAtual } from "@/lib/auth/sessao";
import { listarComparativos } from "@/lib/comparativos/db";
import { formatarData } from "@/lib/format";

export const metadata: Metadata = { title: "Comparativos — Vetly" };
export const dynamic = "force-dynamic";

export default async function ComparativosPage() {
  const userId = await usuarioAtual();
  const comparativos = await listarComparativos(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
            Comparativos
          </h1>
          <p className="text-sm text-texto-2 mt-1">
            Compare propostas e descubra a melhor escolha pelo seu critério.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/comparativos/novo"
            className="font-body font-semibold text-sm bg-transparent text-ink px-4 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
          >
            Comparar analisadas
          </Link>
          <Link
            href="/comparativos/subir"
            className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
          >
            Subir e comparar
          </Link>
        </div>
      </div>

      {comparativos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[color:var(--border-default)] rounded-xl">
          <p className="font-display font-bold text-lg text-ink">
            Nenhuma comparação ainda
          </p>
          <p className="text-sm text-texto-2 mt-1 mb-6">
            Selecione 2 ou mais propostas analisadas e deixe a IA recomendar.
          </p>
          <Link
            href="/comparativos/subir"
            className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
          >
            Subir e comparar
          </Link>
        </div>
      ) : (
        <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-warm">
              <tr className="text-left text-texto-3 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Comparação</th>
                <th className="px-4 py-3 font-semibold">Propostas</th>
                <th className="px-4 py-3 font-semibold">Criada</th>
              </tr>
            </thead>
            <tbody>
              {comparativos.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[color:var(--border-subtle)] hover:bg-[rgba(200,255,2,0.06)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/comparativos/${c.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {c.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-2">{c.qtd_propostas}</td>
                  <td className="px-4 py-3 text-texto-3">
                    {formatarData(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
