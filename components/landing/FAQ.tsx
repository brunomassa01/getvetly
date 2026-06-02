const PERGUNTAS = [
  {
    q: "O que é o Vetly?",
    a: "Uma ferramenta de análise de propostas comerciais para times de compras e procurement. Você sobe a proposta do fornecedor e a IA devolve um relatório padronizado, com leitura crítica, comparação e apresentação prontas.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "Você se cadastra sem cartão de crédito e já ganha algumas análises por nossa conta para experimentar de verdade. Quando quiser continuar, escolhe um plano.",
  },
  {
    q: "Quais formatos a IA consegue ler?",
    a: "PDF, Excel (todas as abas) e Word. Você pode subir vários arquivos de um mesmo fornecedor de uma vez.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Cada empresa tem seus dados isolados, com controle de acesso por linha no banco. Nada é compartilhado entre contas.",
  },
  {
    q: "Posso usar a minha marca?",
    a: "Pode. Logo e cores da sua empresa aparecem nos relatórios e apresentações (whitelabel), inclusive no link que você manda para a diretoria.",
  },
  {
    q: "Consigo cancelar quando quiser?",
    a: "Sim, sem fidelidade. Você assina mensalmente e cancela a qualquer momento.",
  },
];

export function FAQ() {
  return (
    <section className="w-full bg-paper-warm">
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28">
        <h2 className="text-center font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Perguntas frequentes
        </h2>

        <div className="mt-12 space-y-3">
          {PERGUNTAS.map((p) => (
            <details
              key={p.q}
              className="group bg-paper border border-[color:var(--border-subtle)] rounded-xl px-5 py-4"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none font-display font-bold text-ink">
                {p.q}
                <span className="ml-4 text-texto-3 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-texto-2 leading-relaxed">{p.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
