import type { Metadata } from "next";
import Link from "next/link";
import { usuarioAtual } from "@/lib/auth/sessao";
import { listarFornecedores } from "@/lib/fornecedores/db";
import { PropostaForm } from "@/components/propostas/PropostaForm";

export const metadata: Metadata = { title: "Nova proposta — Vetly" };
export const dynamic = "force-dynamic";

export default async function NovaPropostaPage() {
  const userId = await usuarioAtual();
  const fornecedores = await listarFornecedores(userId);

  return (
    <div className="max-w-xl">
      <Link href="/propostas" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-6">
        Nova proposta
      </h1>
      <PropostaForm
        fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))}
      />
    </div>
  );
}
