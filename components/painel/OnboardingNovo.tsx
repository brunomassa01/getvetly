import Link from "next/link";

const PASSOS = [
  {
    n: 1,
    titulo: "Suba a proposta",
    desc: "Envie o PDF, Excel ou Word do fornecedor. Pode ser mais de um arquivo da mesma proposta.",
  },
  {
    n: 2,
    titulo: "A IA analisa",
    desc: "Em segundo plano, a IA extrai valores e condições e monta um relatório com leitura crítica.",
  },
  {
    n: 3,
    titulo: "Compare e decida",
    desc: "Junte propostas concorrentes num comparativo — a IA recomenda a melhor pelo seu critério.",
  },
  {
    n: 4,
    titulo: "Apresente e aprove",
    desc: "Gere a apresentação (PDF/PPT) e compartilhe um link para a diretoria aprovar — sem login.",
  },
];

/** Guia de primeiro acesso — aparece só quando a conta ainda está vazia. */
export function OnboardingNovo() {
  return (
    <section className="rounded-2xl border border-[color:var(--border-default)] bg-white p-6 sm:p-8">
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3 py-1.5">
        Bem-vindo
      </span>
      <h2 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tighter mt-3">
        Como o Get Vetly funciona
      </h2>
      <p className="text-sm text-texto-2 mt-1">
        Quatro passos do arquivo do fornecedor até a aprovação da diretoria.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {PASSOS.map((p) => (
          <div key={p.n} className="flex items-start gap-3">
            <span className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-ink text-paper font-display font-bold text-sm">
              {p.n}
            </span>
            <div>
              <p className="font-display font-bold text-ink">{p.titulo}</p>
              <p className="text-sm text-texto-2 mt-0.5">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/propostas/nova"
        className="inline-block mt-6 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
      >
        Analisar minha primeira proposta →
      </Link>
    </section>
  );
}
