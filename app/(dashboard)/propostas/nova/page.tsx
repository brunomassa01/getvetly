import type { Metadata } from "next";
import Link from "next/link";
import { PropostaForm } from "@/components/propostas/PropostaForm";

export const metadata: Metadata = { title: "Nova proposta — Vetly" };

export default function NovaPropostaPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Link href="/propostas" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-2">
        Nova proposta
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Só subir e pronto — a IA lê e monta o relatório.
      </p>
      <PropostaForm />
    </div>
  );
}
