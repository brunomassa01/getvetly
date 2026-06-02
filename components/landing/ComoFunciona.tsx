const PASSOS = [
  {
    n: "1",
    titulo: "Suba uma ou várias propostas",
    texto:
      "Arraste PDF, Excel ou Word — sem formulário. Subiu uma? Vira análise. Subiu várias (uma por fornecedor)? A IA já monta o comparativo lado a lado.",
  },
  {
    n: "2",
    titulo: "A IA analisa e compara",
    texto:
      "Em minutos, extrai valores, escopo e condições, aponta os riscos e o que questionar — e, quando são várias, recomenda o melhor fornecedor com justificativa.",
  },
  {
    n: "3",
    titulo: "Apresente e aprove",
    texto:
      "A IA já monta a apresentação (PDF ou PPT editável) pronta pra diretoria, com a sua marca. Gere um link e eles aprovam ou recusam online — sem precisar de conta.",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="w-full max-w-6xl mx-auto px-6 py-20 sm:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <span className="font-mono text-[11px] tracking-wide3 uppercase text-texto-3">
          Como funciona
        </span>
        <h2 className="mt-3 font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Da proposta à decisão em 3 passos
        </h2>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {PASSOS.map((p) => (
          <div key={p.n} className="text-center md:text-left">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-lime text-ink font-display font-extrabold text-lg">
              {p.n}
            </span>
            <h3 className="mt-5 font-display font-bold text-ink text-xl tracking-tight">
              {p.titulo}
            </h3>
            <p className="mt-2 text-texto-2 leading-relaxed">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
