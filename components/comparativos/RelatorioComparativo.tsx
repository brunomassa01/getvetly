import type { Comparativo } from "@/lib/ai/comparar-schema";

export function RelatorioComparativo({
  comparativo,
}: {
  comparativo: Comparativo;
}) {
  const { propostas, matriz, recomendacao, vencedor_ref, cenarios } =
    comparativo;

  return (
    <div className="space-y-6">
      {/* Recomendação + vencedor */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display font-bold text-lg text-ink">
            Recomendação
          </h2>
          <span className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold bg-lime-faint text-[#5C7A0E]">
            Vencedor: {vencedor_ref}
          </span>
        </div>
        <p className="text-sm text-texto-1 leading-relaxed">{recomendacao}</p>
      </section>

      {/* Matriz comparativa */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-3">
          Matriz comparativa
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-texto-3 text-xs uppercase tracking-wide border-b border-[color:var(--border-subtle)]">
                <th className="py-2 pr-4 font-semibold">Critério</th>
                {propostas.map((p) => (
                  <th key={p.ref} className="py-2 px-3 font-semibold">
                    {p.ref}
                  </th>
                ))}
                <th className="py-2 pl-3 font-semibold">Vencedor</th>
              </tr>
            </thead>
            <tbody>
              {matriz.map((linha, i) => (
                <tr
                  key={i}
                  className="border-b border-[color:var(--border-subtle)] last:border-0"
                >
                  <td className="py-2 pr-4 text-texto-2 font-medium">
                    {linha.criterio}
                  </td>
                  {propostas.map((p) => {
                    const av = linha.avaliacoes.find((a) => a.ref === p.ref);
                    return (
                      <td
                        key={p.ref}
                        className={`py-2 px-3 ${
                          av?.destaque
                            ? "bg-lime-faint text-[#5C7A0E] font-semibold rounded"
                            : "text-ink"
                        }`}
                      >
                        {av?.valor ?? "—"}
                      </td>
                    );
                  })}
                  <td className="py-2 pl-3 text-texto-2">
                    {linha.vencedor_ref ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cenários */}
      {cenarios.length > 0 && (
        <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-3">
            Cenários de decisão
          </h2>
          <ul className="space-y-3">
            {cenarios.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="text-ink">
                  <strong>Se</strong> {c.se} →{" "}
                </span>
                <span className="font-semibold text-[#5C7A0E]">
                  {c.entao_ref}
                </span>
                <p className="text-texto-3 mt-0.5">{c.porque}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
