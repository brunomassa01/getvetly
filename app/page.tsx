import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { Diferenciais } from "@/components/landing/Diferenciais";
import { Planos } from "@/components/landing/Planos";
import { FAQ } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Vetly — Análise honesta de propostas comerciais com IA",
  description:
    "Suba a proposta do fornecedor e a IA devolve um relatório padronizado, com leitura crítica, comparação e apresentação pronta para a diretoria. Para times de compras e procurement.",
};

function Nav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[color:var(--border-subtle)] bg-paper/80 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo className="h-7 w-auto" />
        <div className="flex items-center gap-6">
          <a
            href="#como-funciona"
            className="hidden sm:inline text-sm text-texto-2 hover:text-ink transition-colors"
          >
            Como funciona
          </a>
          <a
            href="#planos"
            className="hidden sm:inline text-sm text-texto-2 hover:text-ink transition-colors"
          >
            Planos
          </a>
          <Link
            href="/login"
            className="text-sm text-texto-2 hover:text-ink transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="font-body font-semibold text-sm bg-lime text-ink px-4 py-2 rounded-md hover:bg-lime-deep transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
      <span className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-wide3 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3.5 py-2 mb-9">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
        Para times de compras e procurement
      </span>

      <h1 className="font-display font-extrabold text-ink leading-[1.04] tracking-tightest text-4xl sm:text-5xl md:text-6xl max-w-3xl mx-auto text-balance">
        A análise{" "}
        <em className="not-italic bg-lime px-1.5 rounded-sm">honesta</em> de cada
        proposta comercial.
      </h1>

      <p className="mt-6 text-lg text-texto-2 max-w-2xl mx-auto leading-relaxed">
        Suba a proposta do fornecedor e a IA devolve um relatório padronizado,
        com leitura crítica, comparação e apresentação pronta para a diretoria.
        Decida bem, em minutos.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/cadastro"
          className="font-body font-semibold text-base bg-lime text-ink px-7 py-3 rounded-md transition-colors hover:bg-lime-deep"
        >
          Começar grátis
        </Link>
        <a
          href="#planos"
          className="font-body font-semibold text-base text-ink px-7 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Ver planos
        </a>
      </div>

      <p className="mt-5 text-sm text-texto-3">
        Sem cartão. Suas primeiras análises são por nossa conta.
      </p>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-20 sm:py-28">
      <div className="rounded-2xl bg-ink text-paper px-8 py-14 sm:px-14 sm:py-20 text-center">
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tighter max-w-2xl mx-auto leading-tight">
          Pare de analisar proposta no escuro.
        </h2>
        <p className="mt-4 text-paper/80 max-w-xl mx-auto leading-relaxed">
          Comece grátis hoje e veja a primeira análise pronta em minutos.
        </p>
        <Link
          href="/cadastro"
          className="mt-9 inline-block font-body font-semibold text-base bg-lime text-ink px-8 py-3.5 rounded-md hover:bg-lime-deep transition-colors"
        >
          Começar grátis
        </Link>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="w-full border-t border-[color:var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo className="h-6 w-auto" />
        <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3 text-center">
          Vetly · {new Date().getFullYear()} · análise de propostas para procurement
        </span>
        <a
          href="mailto:contato@getvetly.com"
          className="text-sm text-texto-2 hover:text-ink transition-colors"
        >
          contato@getvetly.com
        </a>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <Hero />
      <ComoFunciona />
      <Diferenciais />
      <Planos />
      <FAQ />
      <CTAFinal />
      <Rodape />
    </main>
  );
}
