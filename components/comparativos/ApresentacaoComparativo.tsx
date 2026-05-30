import { Logo } from "@/components/Logo";
import { formatarData } from "@/lib/format";
import type { Comparativo } from "@/lib/ai/comparar-schema";
import type { Workspace } from "@/lib/workspace/db";

function ehNaoInformado(valor: string): boolean {
  return /n[aã]o informado|n\/d|indispon/i.test(valor.trim());
}
function ehRisco(valor: string): boolean {
  return /risco/i.test(valor);
}

function ValorCelula({ valor }: { valor: string }) {
  if (ehNaoInformado(valor))
    return <span className="text-texto-3 italic">não informado</span>;
  if (ehRisco(valor)) return <span className="text-danger">{valor}</span>;
  return <span>{valor}</span>;
}

/**
 * Layout de APRESENTAÇÃO EXECUTIVA do comparativo — desenhado para virar PDF
 * bonito (capa, recomendação em destaque, matriz, cenários), com quebras de
 * página entre as seções.
 */
export function ApresentacaoComparativo({
  comparativo,
  workspace,
  titulo,
  criadoEm,
}: {
  comparativo: Comparativo;
  workspace: Workspace | null;
  titulo: string;
  criadoEm: string;
}) {
  const { propostas, matriz, resumo, recomendacao, vencedor_ref, cenarios } =
    comparativo;
  const temLogo = !!workspace?.whitelabel_logo_url;
  const nomeEmpresa = workspace?.whitelabel_empresa_nome || workspace?.nome;
  const corFundo = workspace?.whitelabel_cor_primaria || "#1E1E1E";
  const corDestaque = workspace?.whitelabel_cor_secundaria || "#C8FF02";

  return (
    <div className="mx-auto max-w-3xl bg-white text-ink">
      {/* ===== Capa ===== */}
      <header
        className="rounded-2xl text-paper p-8 sm:p-10 print:rounded-none break-inside-avoid"
        style={{ backgroundColor: corFundo }}
      >
        <div className="flex items-center justify-between gap-4">
          {temLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/whitelabel/${workspace!.id}`}
              alt={nomeEmpresa ?? "Empresa"}
              className="h-9 w-auto bg-white rounded px-2 py-1"
            />
          ) : (
            <Logo variant="inverted" className="h-7 w-auto" />
          )}
          <span
            className="font-mono text-[10px] tracking-wide3 uppercase"
            style={{ color: corDestaque }}
          >
            Comparativo de propostas
          </span>
        </div>

        <h1 className="mt-8 font-display font-extrabold text-3xl sm:text-4xl tracking-tightest">
          {titulo}
        </h1>
        <p className="mt-2 text-sm text-paper/60">
          {nomeEmpresa ? `${nomeEmpresa} · ` : ""}
          {formatarData(criadoEm)}
        </p>

        <div
          className="mt-8 inline-flex flex-col gap-1 rounded-xl px-5 py-4"
          style={{ backgroundColor: corDestaque, color: corFundo }}
        >
          <span className="font-mono text-[10px] tracking-wide3 uppercase">
            Recomendação
          </span>
          <span className="font-display font-extrabold text-xl tracking-tighter">
            {vencedor_ref}
          </span>
        </div>
      </header>

      {/* ===== Recomendação ===== */}
      <section className="mt-8 break-inside-avoid">
        {resumo && (
          <p className="font-display font-bold text-xl sm:text-2xl text-ink leading-snug tracking-tight max-w-2xl">
            {resumo}
          </p>
        )}
        <p className="mt-4 text-sm text-texto-2 leading-relaxed whitespace-pre-line max-w-2xl">
          {recomendacao}
        </p>
      </section>

      {/* ===== Matriz ===== */}
      <section className="mt-10 break-before-page">
        <h2 className="font-display font-extrabold text-xl text-ink tracking-tighter mb-4">
          Comparativo lado a lado
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-texto-3 text-xs uppercase tracking-wide font-semibold py-2 pr-4 align-bottom border-b-2 border-[color:var(--border-default)]">
                  Critério
                </th>
                {propostas.map((p) => (
                  <th
                    key={p.ref}
                    className="text-left py-2 px-3 align-bottom min-w-[130px] border-b-2 border-[color:var(--border-default)]"
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
                <tr
                  key={i}
                  className={`break-inside-avoid ${i % 2 === 1 ? "bg-paper-warm/40" : ""}`}
                >
                  <td className="py-2.5 pr-4 text-texto-2 font-medium align-top">
                    {linha.criterio}
                  </td>
                  {propostas.map((p) => {
                    const av = linha.avaliacoes.find((a) => a.ref === p.ref);
                    const venc = !!av?.destaque;
                    return (
                      <td
                        key={p.ref}
                        className={`py-2.5 px-3 align-top ${
                          venc
                            ? "bg-lime-faint font-semibold text-[#5C7A0E]"
                            : ""
                        }`}
                      >
                        <span className="inline-flex items-start gap-1">
                          {venc && <span className="text-lime-deep">✓</span>}
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
      </section>

      {/* ===== Cenários ===== */}
      {cenarios.length > 0 && (
        <section className="mt-10 break-before-page">
          <h2 className="font-display font-extrabold text-xl text-ink tracking-tighter mb-4">
            Cenários de decisão
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cenarios.map((c, i) => (
              <div
                key={i}
                className="break-inside-avoid border border-[color:var(--border-subtle)] rounded-xl p-5 bg-paper-warm/40"
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

      {/* ===== Rodapé ===== */}
      <footer className="mt-12 pt-4 border-t border-[color:var(--border-subtle)] flex items-center justify-between break-inside-avoid">
        <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
          {nomeEmpresa ?? "Vetly"} · análise de propostas
        </span>
        <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
          gerado por getvetly.com
        </span>
      </footer>
    </div>
  );
}
