import type { Metadata } from "next";
import Link from "next/link";
import { CompararUploadForm } from "@/components/comparativos/CompararUploadForm";
import { Paywall } from "@/components/Paywall";
import { usuarioAtual } from "@/lib/auth/sessao";
import { verificarAcessoAnalise } from "@/lib/stripe/assinatura";

export const metadata: Metadata = { title: "Comparar novas propostas — Vetly" };
export const dynamic = "force-dynamic";

export default async function CompararSubirPage() {
  const userId = await usuarioAtual();
  const acesso = await verificarAcessoAnalise(userId);

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/comparativos" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-2">
        Comparar novas propostas
      </h1>

      {acesso.permitido ? (
        <>
          <p className="text-sm text-texto-2 mb-6">
            Suba as propostas de fornecedores diferentes — a IA analisa cada uma
            e já entrega a comparação com recomendação.
          </p>
          <CompararUploadForm />
        </>
      ) : (
        <Paywall />
      )}
    </div>
  );
}
