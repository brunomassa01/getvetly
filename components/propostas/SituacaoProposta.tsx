import { marcarSituacaoAction } from "@/app/(dashboard)/propostas/actions";
import { ROTULO_SITUACAO, COR_SITUACAO } from "@/lib/propostas/schema";
import { formatarData } from "@/lib/format";

function Botao({
  id,
  situacao,
  children,
  variante = "neutro",
}: {
  id: string;
  situacao: string;
  children: React.ReactNode;
  variante?: "neutro" | "primario" | "perigo";
}) {
  const classe =
    variante === "primario"
      ? "bg-lime text-ink hover:bg-lime-deep"
      : variante === "perigo"
        ? "bg-[#FBE3E3] text-[#8E2828] hover:opacity-90"
        : "bg-transparent text-ink border border-[color:var(--border-strong)] hover:bg-paper-warm";
  return (
    <form action={marcarSituacaoAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="situacao" value={situacao} />
      <button
        type="submit"
        className={`font-body font-semibold text-sm px-4 py-2 rounded-md transition-colors ${classe}`}
      >
        {children}
      </button>
    </form>
  );
}

export function SituacaoProposta({
  id,
  situacao,
  apresentadaEm,
  decididaEm,
}: {
  id: string;
  situacao: string;
  apresentadaEm: string | null;
  decididaEm: string | null;
}) {
  return (
    <section className="print:hidden bg-white border border-[color:var(--border-subtle)] rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-texto-3">Situação</span>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${COR_SITUACAO[situacao] ?? COR_SITUACAO.em_aberto}`}
          >
            {ROTULO_SITUACAO[situacao] ?? "Em aberto"}
          </span>
          {situacao === "apresentada" && apresentadaEm && (
            <span className="text-xs text-texto-3">
              apresentada em {formatarData(apresentadaEm)}
            </span>
          )}
          {(situacao === "aprovada" || situacao === "recusada") && decididaEm && (
            <span className="text-xs text-texto-3">
              decidida em {formatarData(decididaEm)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {situacao === "em_aberto" && (
            <Botao id={id} situacao="apresentada" variante="primario">
              Marcar como apresentada
            </Botao>
          )}
          {situacao === "apresentada" && (
            <>
              <Botao id={id} situacao="aprovada" variante="primario">
                ✓ Aprovada
              </Botao>
              <Botao id={id} situacao="recusada" variante="perigo">
                ✕ Recusada
              </Botao>
            </>
          )}
          {(situacao === "aprovada" || situacao === "recusada") && (
            <Botao id={id} situacao="em_aberto">
              Reabrir
            </Botao>
          )}
        </div>
      </div>
    </section>
  );
}
