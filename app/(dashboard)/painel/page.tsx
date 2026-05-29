import type { Metadata } from "next";
import { auth } from "@/auth";
import { sairAction } from "@/app/(auth)/actions";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Painel — Vetly" };

export default async function PainelPage() {
  const session = await auth();
  const nome = session?.user?.name ?? session?.user?.email ?? "você";

  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[color:var(--border-subtle)]">
        <Logo className="h-7 w-auto" />
        <form action={sairAction}>
          <button
            type="submit"
            className="font-body font-medium text-sm text-texto-2 hover:text-ink transition-colors"
          >
            Sair
          </button>
        </form>
      </header>

      <section className="flex-1 w-full max-w-6xl mx-auto px-6 py-16">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
          Conta ativa
        </span>
        <h1 className="font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Olá, {nome}.
        </h1>
        <p className="mt-3 text-base text-texto-2 max-w-xl">
          Seu workspace está pronto. As telas de propostas, fornecedores e
          análises chegam nas próximas etapas.
        </p>
      </section>
    </main>
  );
}
