const ITENS = [
  {
    titulo: "Leitura crítica honesta",
    texto:
      "Não é resumo bonitinho. A IA aponta o que questionar, os riscos e o que ficou de fora — pra você não fechar no escuro.",
  },
  {
    titulo: "Comparação lado a lado",
    texto:
      "Coloque fornecedores na mesma régua e veja o recomendado, com a justificativa e cenários de decisão.",
  },
  {
    titulo: "Apresentação pronta",
    texto:
      "Gere um PDF ou PPT editável, com a sua marca, pra levar à diretoria em um clique. A IA monta o roteiro.",
  },
  {
    titulo: "Aprovação por link",
    texto:
      "Compartilhe um link e a diretoria aprova ou recusa online — sem precisar criar conta. Tudo registrado.",
  },
  {
    titulo: "Histórico de fornecedores",
    texto:
      "Cada análise alimenta o histórico do fornecedor automaticamente. Você vê a evolução das propostas no tempo.",
  },
  {
    titulo: "A sua marca (whitelabel)",
    texto:
      "Logo e cores da sua empresa nos relatórios e apresentações. O cliente vê o seu trabalho, não o nosso.",
  },
];

export function Diferenciais() {
  return (
    <section className="w-full bg-paper-warm">
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <span className="font-mono text-[11px] tracking-wide3 uppercase text-texto-3">
            Por que o Vetly
          </span>
          <h2 className="mt-3 font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
            Feito para quem decide compras
          </h2>
          <p className="mt-3 text-texto-2 leading-relaxed">
            Concorrentes grandes (Coupa, GEP) são caros e pesados. O Vetly é
            direto ao ponto, no preço de quem é PME.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITENS.map((item) => (
            <div
              key={item.titulo}
              className="bg-paper border border-[color:var(--border-subtle)] rounded-xl p-6"
            >
              <div className="h-1.5 w-9 rounded-full bg-lime mb-4" />
              <h3 className="font-display font-bold text-ink text-lg tracking-tight">
                {item.titulo}
              </h3>
              <p className="mt-2 text-sm text-texto-2 leading-relaxed">
                {item.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
