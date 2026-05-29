import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarFornecedor } from "@/lib/fornecedores/db";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { atualizarFornecedorAction, arquivarFornecedorAction } from "../actions";

export const metadata: Metadata = { title: "Editar fornecedor — Vetly" };
export const dynamic = "force-dynamic";

export default async function EditarFornecedorPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await usuarioAtual();
  const fornecedor = await buscarFornecedor(userId, params.id);
  if (!fornecedor) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/fornecedores" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-6">
        Editar fornecedor
      </h1>

      <FornecedorForm action={atualizarFornecedorAction} fornecedor={fornecedor} />

      <div className="mt-10 pt-6 border-t border-[color:var(--border-subtle)]">
        <form action={arquivarFornecedorAction}>
          <input type="hidden" name="id" value={fornecedor.id} />
          <button
            type="submit"
            className="text-sm font-medium text-danger hover:underline"
          >
            Arquivar fornecedor
          </button>
        </form>
      </div>
    </div>
  );
}
