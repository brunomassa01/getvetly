import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Topo */}
      <header className="w-full max-w-6xl mx-auto px-6 py-7 flex items-center justify-between">
        <Logo className="h-8 w-auto" />
        <span className="font-mono text-[11px] tracking-wide2 uppercase text-texto-3">
          preview
        </span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <span className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-wide3 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3.5 py-2 mb-9">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
          Em construção
        </span>

        <h1 className="font-display font-extrabold text-ink leading-[1.04] tracking-tightest text-4xl sm:text-5xl md:text-6xl max-w-3xl text-balance">
          A análise{" "}
          <em className="not-italic bg-lime px-1.5 rounded-sm">honesta</em> de
          cada proposta comercial.
        </h1>

        <p className="mt-5 text-base text-texto-2 max-w-xl leading-relaxed">
          A Vetly transforma propostas de fornecedores em relatórios
          padronizados com leitura crítica honesta — para times de compras que
          querem decidir bem.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:contato@getvetly.com"
            className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md transition-colors hover:bg-lime-deep"
          >
            Quero ser cliente piloto
          </a>
          <span className="font-mono text-[11px] tracking-wide2 uppercase text-texto-3">
            getvetly.com
          </span>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-[color:var(--border-subtle)] text-center">
        <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
          Vetly · {new Date().getFullYear()} · análise de propostas para
          procurement
        </span>
      </footer>
    </main>
  );
}
