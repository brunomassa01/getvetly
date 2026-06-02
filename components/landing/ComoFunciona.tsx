const PASSOS = [
  {
    n: "1",
    titulo: "Suba a proposta",
    texto:
      "Arraste o PDF, Excel ou Word do fornecedor. Não precisa preencher formulário — é só subir.",
  },
  {
    n: "2",
    titulo: "A IA analisa",
    texto:
      "Em minutos, ela extrai valores, escopo e condições, e aponta os riscos e os pontos que você precisa questionar.",
  },
  {
    n: "3",
    titulo: "Decida e apresente",
    texto:
      "Relatório padronizado, comparação entre fornecedores e apresentação (PDF/PPT) com a sua marca, prontos para a diretoria.",
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
