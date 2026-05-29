import type { Metadata } from "next";
import Link from "next/link";
import { CompararUploadForm } from "@/components/comparativos/CompararUploadForm";

export const metadata: Metadata = { title: "Comparar novas propostas — Vetly" };

export default function CompararSubirPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Link href="/comparativos" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-2">
        Comparar novas propostas
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Suba as propostas de fornecedores diferentes — a IA analisa cada uma e
        já entrega a comparação com recomendação.
      </p>
      <CompararUploadForm />
    </div>
  );
}
