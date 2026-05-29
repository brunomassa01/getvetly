import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Painel — Vetly" };

export default async function PainelPage() {
  const session = await auth();
  const nome = session?.user?.name ?? session?.user?.email ?? "você";

  return (
    <section>
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3 py-1.5 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
        Conta ativa
      </span>
      <h1 className="font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
        Olá, {nome}.
      </h1>
      <p className="mt-3 text-base text-texto-2 max-w-xl">
        Seu workspace está pronto. Comece cadastrando seus fornecedores.
      </p>
      <Link
        href="/fornecedores"
        className="inline-block mt-8 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
      >
        Ver fornecedores
      </Link>
    </section>
  );
}
