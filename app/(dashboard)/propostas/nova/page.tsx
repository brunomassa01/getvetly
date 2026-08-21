import type { Metadata } from "next";
import Link from "next/link";
import { PropostaForm } from "@/components/propostas/PropostaForm";
import { Paywall } from "@/components/Paywall";
import { usuarioAtual } from "@/lib/auth/sessao";
import { verificarAcessoAnalise } from "@/lib/stripe/assinatura";

export const metadata: Metadata = { title: "Nova proposta — Vetly" };
export const dynamic = "force-dynamic";

export default async function NovaPropostaPage() {
  const userId = await usuarioAtual();
  const acesso = await verificarAcessoAnalise(userId);
  const emTrial = acesso.permitido && acesso.restantes > 0;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/propostas" className="text-sm text-texto-2 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2 mb-2">
        Nova proposta
      </h1>

      {acesso.permitido ? (
        <>
          <p className="text-sm text-texto-2 mb-6">
            Só subir e pronto — a IA lê e monta o relatório.
          </p>
          {emTrial && (
            <p className="mb-5 text-sm bg-lime-faint border border-lime-soft rounded-lg px-4 py-2.5 text-[#5C7A0E]">
              Teste grátis: você tem <strong>{acesso.restantes}</strong> de{" "}
              {acesso.limite} análises restantes.
            </p>
          )}
          <PropostaForm />
        </>
      ) : (
        <Paywall />
      )}
    </div>
  );
}
