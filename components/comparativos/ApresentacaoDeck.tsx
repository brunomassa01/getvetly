import { Logo } from "@/components/Logo";
import { formatarData } from "@/lib/format";
import type { Deck, Slide } from "@/lib/comparativos/deck-schema";
import type { Workspace } from "@/lib/workspace/db";

// hex (#RRGGBB) → rgba com alpha (tints suaves).
function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(200,255,2,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ehRisco = (v: string) => /risco/i.test(v);
const ehNaoInformado = (v: string) => /n[aã]o informado|n\/d|indispon/i.test(v);

export function ApresentacaoDeck({
  deck,
  workspace,
  criadoEm,
  eyebrow,
  subinfo,
  chips = [],
  banda,
}: {
  deck: Deck;
  workspace: Workspace | null;
  criadoEm: string;
  eyebrow: string;
  subinfo?: string;
  chips?: string[];
  banda?: { rotulo: string; valor: string } | null;
}) {
  const temLogo = !!workspace?.whitelabel_logo_url;
  const nomeEmpresa = workspace?.whitelabel_empresa_nome || workspace?.nome;
  const corFundo = workspace?.whitelabel_cor_primaria || "#1E1E1E";
  const corDestaque = workspace?.whitelabel_cor_secundaria || "#C8FF02";

  const TituloSecao = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-6">
      <span
        className="h-6 w-1.5 rounded-full"
        style={{ backgroundColor: corDestaque }}
      />
      <h2 className="font-display font-extrabold text-2xl text-ink tracking-tighter">
        {children}
      </h2>
    </div>
  );

  function renderSlide(s: Slide, i: number) {
    switch (s.tipo) {
      case "capa":
        return (
          <header
            key={i}
            className="relative overflow-hidden rounded-2xl text-paper p-10 sm:p-12 print:rounded-none break-inside-avoid flex flex-col min-h-[520px] print:min-h-screen print:justify-center"
            style={{ backgroundColor: corFundo }}
          >
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
                {eyebrow}
              </span>
            </div>

            <div className="mt-auto pt-12">
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tightest leading-[1.05]">
                {s.titulo}
              </h1>
              <div
                className="mt-4 h-1 w-16 rounded-full"
                style={{ backgroundColor: corDestaque }}
              />
              {s.subtitulo && (
                <p className="mt-4 text-base text-paper/85 max-w-xl">
                  {s.subtitulo}
                </p>
              )}
              <p className="mt-3 text-sm text-paper/60">
                {[
                  nomeEmpresa,
                  formatarData(criadoEm),
                  subinfo,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {chips.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {chips.map((ref) => (
                    <span
                      key={ref}
                      className="rounded-full px-3 py-1 text-xs text-paper/90"
                      style={{ border: `1px solid ${rgba(corDestaque, 0.5)}` }}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {banda && (
              <div
                className="mt-8 rounded-xl px-6 py-5"
                style={{ backgroundColor: corDestaque, color: corFundo }}
              >
                <span className="font-mono text-[10px] tracking-wide3 uppercase opacity-80">
                  {banda.rotulo}
                </span>
                <span className="block font-display font-extrabold text-2xl tracking-tighter mt-0.5">
                  {banda.valor}
                </span>
              </div>
            )}
          </header>
        );

      case "destaques":
        return (
          <section key={i} className="mt-12 break-before-page break-inside-avoid">
            <TituloSecao>{s.titulo}</TituloSecao>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  s.metricas.length,
                  4,
                )}, minmax(0, 1fr))`,
              }}
            >
              {s.metricas.map((m, j) => (
                <div
                  key={j}
                  className="rounded-2xl p-6 text-center"
                  style={{ backgroundColor: rgba(corDestaque, 0.16) }}
                >
                  <div
                    className="font-display font-extrabold tracking-tighter text-3xl sm:text-4xl"
                    style={{ color: corFundo }}
                  >
                    {m.valor}
                  </div>
                  <div
                    className="mx-auto mt-3 h-1 w-8 rounded-full"
                    style={{ backgroundColor: corDestaque }}
                  />
                  <div className="mt-3 text-sm text-texto-2">{m.rotulo}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case "recomendacao":
        return (
          <section key={i} className="mt-12 break-inside-avoid">
            <TituloSecao>{s.titulo}</TituloSecao>
            <p
              className="font-display font-bold text-xl sm:text-2xl text-ink leading-snug tracking-tight max-w-2xl pl-4 border-l-4"
              style={{ borderColor: corDestaque }}
            >
              {s.headline}
            </p>
            <div className="mt-5 space-y-3 max-w-2xl">
              {s.paragrafos.map((p, j) => (
                <p key={j} className="text-sm text-texto-2 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </section>
        );

      case "tabela":
        return (
          <section key={i} className="mt-12 break-before-page">
            <TituloSecao>{s.titulo}</TituloSecao>
            <div className="overflow-x-auto rounded-xl border border-[color:var(--border-subtle)]">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr style={{ backgroundColor: corFundo }}>
                    {s.colunas.map((col, j) => (
                      <th
                        key={j}
                        className={`text-left py-3 px-4 align-bottom ${
                          j === 0
                            ? "text-paper/70 text-xs uppercase tracking-wide font-semibold"
                            : "font-display font-bold text-paper text-sm min-w-[130px]"
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.linhas.map((linha, j) => (
                    <tr
                      key={j}
                      className="break-inside-avoid"
                      style={j % 2 === 1 ? { backgroundColor: "#FAFAF7" } : undefined}
                    >
                      {linha.celulas.map((c, k) => (
                        <td
                          key={k}
                          className={`py-3 px-4 align-top border-t border-[color:var(--border-subtle)] ${
                            k === 0 ? "text-texto-2 font-medium" : ""
                          }`}
                          style={
                            c.destaque
                              ? {
                                  backgroundColor: rgba(corDestaque, 0.18),
                                  color: corFundo,
                                  fontWeight: 600,
                                }
                              : undefined
                          }
                        >
                          <span className="inline-flex items-start gap-1.5">
                            {c.destaque && <span style={{ color: corFundo }}>✓</span>}
                            {ehNaoInformado(c.texto) ? (
                              <span className="text-texto-3 italic">{c.texto}</span>
                            ) : ehRisco(c.texto) ? (
                              <span className="text-danger font-medium">{c.texto}</span>
                            ) : (
                              <span>{c.texto}</span>
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );

      case "grafico": {
        const max = Math.max(...s.series.map((p) => p.valor), 1);
        const fmt = (n: number) =>
          n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
        return (
          <section key={i} className="mt-12 break-inside-avoid">
            <TituloSecao>{s.titulo}</TituloSecao>
            <div className="space-y-4 max-w-2xl">
              {s.series.map((p, j) => (
                <div key={j}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink font-medium">{p.rotulo}</span>
                    <span className="text-texto-2 font-mono">
                      {s.unidade ? `${s.unidade} ` : ""}
                      {fmt(p.valor)}
                    </span>
                  </div>
                  <div className="h-6 rounded-md bg-paper-warm overflow-hidden">
                    <div
                      className="h-full rounded-md"
                      style={{
                        width: `${Math.max(4, (p.valor / max) * 100)}%`,
                        backgroundColor: corDestaque,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "cenarios":
        return (
          <section key={i} className="mt-12 break-before-page">
            <TituloSecao>{s.titulo}</TituloSecao>
            <div className="grid sm:grid-cols-2 gap-4">
              {s.itens.map((c, j) => (
                <div
                  key={j}
                  className="break-inside-avoid rounded-xl p-5 bg-white border border-[color:var(--border-subtle)] border-l-4"
                  style={{ borderLeftColor: corDestaque }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                      style={{ backgroundColor: corDestaque, color: corFundo }}
                    >
                      {j + 1}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: rgba(corDestaque, 0.18), color: corFundo }}
                    >
                      {c.recomendado}
                    </span>
                  </div>
                  <p className="text-sm text-ink">
                    <span className="font-semibold">Se</span> {c.condicao}
                  </p>
                  <p className="mt-2 text-xs text-texto-3 leading-relaxed">
                    {c.porque}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );

      case "proximos_passos":
        return (
          <section key={i} className="mt-12 break-inside-avoid">
            <TituloSecao>{s.titulo}</TituloSecao>
            <ol className="space-y-3 max-w-2xl">
              {s.passos.map((passo, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span
                    className="flex shrink-0 items-center justify-center w-7 h-7 rounded-full text-sm font-bold"
                    style={{ backgroundColor: corDestaque, color: corFundo }}
                  >
                    {j + 1}
                  </span>
                  <span className="text-sm text-texto-2 leading-relaxed pt-0.5">
                    {passo}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        );
    }
  }

  const capaSlide = deck.slides.find((s) => s.tipo === "capa");
  const conteudo = deck.slides.filter((s) => s.tipo !== "capa");

  return (
    <div className="text-ink">
      {/* Capa: card estreito na tela; full-bleed (página inteira) no PDF */}
      {capaSlide && (
        <div className="mx-auto max-w-3xl print:max-w-none">
          {renderSlide(capaSlide, 0)}
        </div>
      )}

      {/* Conteúdo: sempre numa coluna estreita e legível */}
      <div className="mx-auto max-w-3xl bg-white">
        {conteudo.map((s, i) => renderSlide(s, i + 1))}

        <footer className="mt-14 pt-4 border-t border-[color:var(--border-subtle)] flex items-center justify-between break-inside-avoid">
          <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
            {nomeEmpresa ?? "Vetly"} · análise de propostas
          </span>
          <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
            gerado por getvetly.com
          </span>
        </footer>
      </div>
    </div>
  );
}
