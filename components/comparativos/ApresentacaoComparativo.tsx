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

// hex (#RRGGBB) → rgba com alpha (para tints suaves).
function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(200,255,2,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ValorCelula({ valor }: { valor: string }) {
  if (ehNaoInformado(valor))
    return <span className="text-texto-3 italic">não informado</span>;
  if (ehRisco(valor))
    return <span className="text-danger font-medium">{valor}</span>;
  return <span>{valor}</span>;
}

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

  // Título de seção com barra de destaque.
  const TituloSecao = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="h-6 w-1.5 rounded-full"
        style={{ backgroundColor: corDestaque }}
      />
      <h2 className="font-display font-extrabold text-2xl text-ink tracking-tighter">
        {children}
      </h2>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl bg-white text-ink">
      {/* ===== Capa ===== */}
      <header
        className="relative overflow-hidden rounded-2xl text-paper p-10 sm:p-12 print:rounded-none break-inside-avoid flex flex-col min-h-[520px]"
        style={{ backgroundColor: corFundo }}
      >
        {/* faixa de destaque no topo */}
        <span
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: corDestaque }}
        />

        <div className="flex items-center justify-between gap-4">
          {temLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/whitelabel/${workspace!.id}`}
              alt={nomeEmpresa ?? "Empresa"}
              className="h-10 w-auto bg-white rounded px-2 py-1"
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

        <div className="mt-auto pt-12">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tightest leading-[1.05]">
            {titulo}
          </h1>
          <div
            className="mt-4 h-1 w-16 rounded-full"
            style={{ backgroundColor: corDestaque }}
          />
          <p className="mt-4 text-sm text-paper/70">
            {nomeEmpresa ? `${nomeEmpresa} · ` : ""}
            {formatarData(criadoEm)} · {propostas.length} propostas
          </p>

          {/* chips das propostas comparadas */}
          <div className="mt-5 flex flex-wrap gap-2">
            {propostas.map((p) => (
              <span
                key={p.ref}
                className="rounded-full px-3 py-1 text-xs text-paper/90"
                style={{ border: `1px solid ${rgba(corDestaque, 0.5)}` }}
              >
                {p.ref}
              </span>
            ))}
          </div>
        </div>

        {/* faixa do vencedor */}
        <div
          className="mt-8 rounded-xl px-6 py-5"
          style={{ backgroundColor: corDestaque, color: corFundo }}
        >
          <span className="font-mono text-[10px] tracking-wide3 uppercase opacity-80">
            Recomendação
          </span>
          <span className="block font-display font-extrabold text-2xl tracking-tighter mt-0.5">
            {vencedor_ref}
          </span>
        </div>
      </header>

      {/* ===== Recomendação ===== */}
      <section className="mt-10 break-inside-avoid">
        <TituloSecao>Recomendação</TituloSecao>
        {resumo && (
          <p
            className="font-display font-bold text-xl sm:text-2xl text-ink leading-snug tracking-tight max-w-2xl pl-4 border-l-4"
            style={{ borderColor: corDestaque }}
          >
            {resumo}
          </p>
        )}
        <p className="mt-5 text-sm text-texto-2 leading-relaxed whitespace-pre-line max-w-2xl">
          {recomendacao}
        </p>
      </section>

      {/* ===== Matriz ===== */}
      <section className="mt-12 break-before-page">
        <TituloSecao>Comparativo lado a lado</TituloSecao>
        <div className="overflow-x-auto rounded-xl border border-[color:var(--border-subtle)]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr style={{ backgroundColor: corFundo }}>
                <th className="text-left text-paper/70 text-xs uppercase tracking-wide font-semibold py-3 px-4 align-bottom">
                  Critério
                </th>
                {propostas.map((p) => (
                  <th
                    key={p.ref}
                    className="text-left py-3 px-3 align-bottom min-w-[140px]"
                  >
                    <span className="block font-display font-bold text-paper text-sm">
                      {p.ref}
                    </span>
                    {p.fornecedor && (
                      <span className="block text-paper/60 text-xs font-normal">
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
                  className="break-inside-avoid"
                  style={
                    i % 2 === 1 ? { backgroundColor: "#FAFAF7" } : undefined
                  }
                >
                  <td className="py-3 px-4 text-texto-2 font-medium align-top border-t border-[color:var(--border-subtle)]">
                    {linha.criterio}
                  </td>
                  {propostas.map((p) => {
                    const av = linha.avaliacoes.find((a) => a.ref === p.ref);
                    const venc = !!av?.destaque;
                    return (
                      <td
                        key={p.ref}
                        className="py-3 px-3 align-top border-t border-[color:var(--border-subtle)]"
                        style={
                          venc
                            ? {
                                backgroundColor: rgba(corDestaque, 0.18),
                                color: corFundo,
                                fontWeight: 600,
                              }
                            : undefined
                        }
                      >
                        <span className="inline-flex items-start gap-1.5">
                          {venc && (
                            <span style={{ color: corFundo }}>✓</span>
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
      </section>

      {/* ===== Cenários ===== */}
      {cenarios.length > 0 && (
        <section className="mt-12 break-before-page">
          <TituloSecao>Cenários de decisão</TituloSecao>
          <div className="grid sm:grid-cols-2 gap-4">
            {cenarios.map((c, i) => (
              <div
                key={i}
                className="break-inside-avoid rounded-xl p-5 bg-white border border-[color:var(--border-subtle)] border-l-4"
                style={{ borderLeftColor: corDestaque }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                    style={{ backgroundColor: corDestaque, color: corFundo }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: rgba(corDestaque, 0.18), color: corFundo }}
                  >
                    {c.entao_ref}
                  </span>
                </div>
                <p className="text-sm text-ink">
                  <span className="font-semibold">Se</span> {c.se}
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
      <footer className="mt-14 pt-4 border-t border-[color:var(--border-subtle)] flex items-center justify-between break-inside-avoid">
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
