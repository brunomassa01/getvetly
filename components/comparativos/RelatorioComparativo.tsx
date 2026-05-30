import type { Comparativo } from "@/lib/ai/comparar-schema";

function ehNaoInformado(valor: string): boolean {
  return /n[aã]o informado|n\/d|indispon/i.test(valor.trim());
}

function ehRisco(valor: string): boolean {
  return /risco/i.test(valor);
}

// Renderiza o valor de uma célula com estilo conforme o conteúdo.
function ValorCelula({ valor }: { valor: string }) {
  if (ehNaoInformado(valor)) {
    return <span className="text-texto-3 italic">não informado</span>;
  }
  if (ehRisco(valor)) {
    return <span className="text-danger">{valor}</span>;
  }
  return <span>{valor}</span>;
}

export function RelatorioComparativo({
  comparativo,
}: {
  comparativo: Comparativo;
}) {
  const { propostas, matriz, resumo, recomendacao, vencedor_ref, cenarios } =
    comparativo;

  return (
    <div className="space-y-6">
      {/* Card de destaque: vencedor + resumo + recomendação */}
      <section className="rounded-xl border border-lime-deep/40 bg-gradient-to-b from-[#FCFFE8] to-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E]">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
          Recomendação
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-texto-3">Melhor escolha:</span>
          <span className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tighter">
            {vencedor_ref}
          </span>
        </div>

        {resumo && (
          <p className="mt-3 text-base sm:text-lg text-ink leading-snug font-medium max-w-2xl">
            {resumo}
          </p>
        )}

        <p className="mt-4 text-sm text-texto-2 leading-relaxed whitespace-pre-line max-w-2xl">
          {recomendacao}
        </p>
      </section>

      {/* Matriz comparativa */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-4">
          Matriz comparativa
        </h2>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-texto-3 text-xs uppercase tracking-wide font-semibold py-2 pr-4 align-bottom">
                  Critério
                </th>
                {propostas.map((p) => (
                  <th
                    key={p.ref}
                    className="text-left py-2 px-3 align-bottom min-w-[140px]"
                  >
                    <span className="block font-display font-bold text-ink text-sm">
                      {p.ref}
                    </span>
                    {p.fornecedor && (
                      <span className="block text-texto-3 text-xs font-normal">
                        {p.fornecedor}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matriz.map((linha, i) => (
                <tr key={i} className={i % 2 === 1 ? "bg-paper-warm/40" : ""}>
                  <td className="py-2.5 pr-4 text-texto-2 font-medium align-top rounded-l-md">
                    {linha.criterio}
                  </td>
                  {propostas.map((p) => {
                    const av = linha.avaliacoes.find((a) => a.ref === p.ref);
                    const vencedora = !!av?.destaque;
                    return (
                      <td
                        key={p.ref}
                        className={`py-2.5 px-3 align-top ${
                          vencedora
                            ? "bg-lime-faint font-semibold text-[#5C7A0E]"
                            : ""
                        }`}
                      >
                        <span className="inline-flex items-start gap-1">
                          {vencedora && (
                            <span aria-hidden className="text-lime-deep">
                              ✓
                            </span>
                          )}
                          {av ? (
                            <ValorCelula valor={av.valor} />
                          ) : (
                            <span className="text-texto-3 italic">—</span>
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-texto-3">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-lime-faint border border-lime-soft align-middle mr-1" />
          célula destacada = melhor nesse critério
        </p>
      </section>

      {/* Cenários de decisão */}
      {cenarios.length > 0 && (
        <section className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-4">
            Cenários de decisão
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {cenarios.map((c, i) => (
              <div
                key={i}
                className="border border-[color:var(--border-subtle)] rounded-lg p-4 bg-paper-warm/40"
              >
                <p className="text-sm text-texto-2">
                  <span className="font-semibold text-ink">Se</span> {c.se}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 font-semibold text-sm">
                  <span className="text-texto-3">→</span>
                  <span className="rounded-full bg-lime-faint text-[#5C7A0E] px-2.5 py-0.5">
                    {c.entao_ref}
                  </span>
                </p>
                <p className="mt-2 text-xs text-texto-3 leading-relaxed">
                  {c.porque}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
