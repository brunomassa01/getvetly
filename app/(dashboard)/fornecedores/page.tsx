import type { Metadata } from "next";
import Link from "next/link";
import { usuarioAtual } from "@/lib/auth/sessao";
import { listarFornecedores } from "@/lib/fornecedores/db";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { BuscaFornecedores } from "@/components/fornecedores/BuscaFornecedores";

export const metadata: Metadata = { title: "Fornecedores — Vetly" };
export const dynamic = "force-dynamic";

function rotuloCategoria(segmento: string | null): string {
  if (!segmento) return "—";
  return ROTULO_CATEGORIA[segmento as Categoria] ?? segmento;
}

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: { busca?: string; categoria?: string };
}) {
  const userId = await usuarioAtual();
  const busca = searchParams.busca ?? "";
  const categoria = searchParams.categoria ?? "";
  const fornecedores = await listarFornecedores(userId, { busca, categoria });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
            Fornecedores
          </h1>
          <p className="text-sm text-texto-2 mt-1">
            Cadastro central dos fornecedores do seu workspace.
          </p>
        </div>
        <Link
          href="/fornecedores/novo"
          className="shrink-0 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
        >
          Novo fornecedor
        </Link>
      </div>

      <BuscaFornecedores buscaInicial={busca} categoriaInicial={categoria} />

      {fornecedores.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[color:var(--border-default)] rounded-xl">
          <p className="font-display font-bold text-lg text-ink">
            {busca || categoria
              ? "Nenhum fornecedor encontrado"
              : "Nenhum fornecedor ainda"}
          </p>
          <p className="text-sm text-texto-2 mt-1 mb-6">
            {busca || categoria
              ? "Tente ajustar a busca ou o filtro."
              : "Cadastre seu primeiro fornecedor para começar."}
          </p>
          {!busca && !categoria && (
            <Link
              href="/fornecedores/novo"
              className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
            >
              Cadastrar primeiro fornecedor
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-warm">
              <tr className="text-left text-texto-3 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">CNPJ</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Cotações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-[color:var(--border-subtle)] hover:bg-[rgba(200,255,2,0.06)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/fornecedores/${f.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {f.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-2">
                    {rotuloCategoria(f.segmento)}
                  </td>
                  <td className="px-4 py-3 text-texto-2">{f.cnpj ?? "—"}</td>
                  <td className="px-4 py-3 text-texto-2">
                    {f.email ?? f.telefone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-texto-3">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
