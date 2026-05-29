import type { Metadata } from "next";
import Link from "next/link";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { criarFornecedorAction } from "../actions";

export const metadata: Metadata = { title: "Novo fornecedor — Vetly" };

export default function NovoFornecedorPage() {
  return (
    <div className="max-w-xl">
      <Link
        href="/fornecedores"
        className="text-sm text-texto-2 hover:text-ink"
      >
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-6">
        Novo fornecedor
      </h1>
      <FornecedorForm action={criarFornecedorAction} />
    </div>
  );
}
