import type { Metadata } from "next";
import Link from "next/link";
import { usuarioAtual } from "@/lib/auth/sessao";
import { listarPropostas } from "@/lib/propostas/db";
import {
  STATUS_PROPOSTA,
  ROTULO_SITUACAO,
  COR_SITUACAO,
} from "@/lib/propostas/schema";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { formatarMoeda, formatarData, codigoCurto } from "@/lib/format";
import { FiltrosPropostas } from "@/components/propostas/FiltrosPropostas";

export const metadata: Metadata = { title: "Propostas — Vetly" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const rotulo = STATUS_PROPOSTA[status] ?? status;
  const cor =
    status === "ready"
      ? "bg-lime-faint text-[#5C7A0E]"
      : status === "failed"
        ? "bg-[#FBE3E3] text-[#8E2828]"
        : status === "processing"
          ? "bg-[#E0EFF5] text-[#1E5468]"
          : "bg-[#E8E6DC] text-texto-2";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}
    >
      {rotulo}
    </span>
  );
}

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: {
    busca?: string;
    status?: string;
    situacao?: string;
    categoria?: string;
    ordenar?: string;
  };
}) {
  const userId = await usuarioAtual();
  const filtros = {
    busca: searchParams.busca ?? "",
    status: searchParams.status ?? "",
    situacao: searchParams.situacao ?? "",
    categoria: searchParams.categoria ?? "",
    ordenar: searchParams.ordenar ?? "",
  };
  const propostas = await listarPropostas(userId, filtros);
  const temFiltro = !!(
    filtros.busca ||
    filtros.status ||
    filtros.situacao ||
    filtros.categoria ||
    filtros.ordenar
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
            Propostas
          </h1>
          <p className="text-sm text-texto-2 mt-1">
            Suas propostas comerciais e o status de cada análise.
          </p>
        </div>
        <Link
          href="/propostas/nova"
          className="shrink-0 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
        >
          Nova proposta
        </Link>
      </div>

      <FiltrosPropostas
        buscaInicial={filtros.busca}
        statusInicial={filtros.status}
        situacaoInicial={filtros.situacao}
        categoriaInicial={filtros.categoria}
        ordenarInicial={filtros.ordenar}
      />

      {propostas.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[color:var(--border-default)] rounded-xl">
          <p className="font-display font-bold text-lg text-ink">
            {temFiltro ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}
          </p>
          <p className="text-sm text-texto-2 mt-1 mb-6">
            {temFiltro
              ? "Tente ajustar a busca ou os filtros."
              : "Crie sua primeira proposta e anexe os arquivos do fornecedor."}
          </p>
          {!temFiltro && (
            <Link
              href="/propostas/nova"
              className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
            >
              Criar primeira proposta
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-warm">
              <tr className="text-left text-texto-3 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Proposta</th>
                <th className="px-4 py-3 font-semibold">Fornecedor</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Valor negociado</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 font-semibold">Criada</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[color:var(--border-subtle)] hover:bg-[rgba(200,255,2,0.06)] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-texto-3">
                    {codigoCurto(p.id)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/propostas/${p.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {p.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-2">
                    {p.fornecedor_nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-texto-2">
                    {ROTULO_CATEGORIA[p.categoria as Categoria] ?? p.categoria}
                  </td>
                  <td className="px-4 py-3 text-texto-2">
                    {formatarMoeda(p.valor_negociado)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COR_SITUACAO[p.situacao] ?? COR_SITUACAO.em_aberto}`}
                    >
                      {ROTULO_SITUACAO[p.situacao] ?? "Em aberto"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-texto-3">
                    {formatarData(p.created_at)}
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
