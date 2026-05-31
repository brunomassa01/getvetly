import {
  apresentarComparativoAction,
  decidirComparativoAction,
  reabrirComparativoAction,
} from "@/app/(dashboard)/comparativos/actions";
import { formatarData } from "@/lib/format";
import type { ComparativoPropostaItem } from "@/lib/comparativos/db";

const ROTULO: Record<string, string> = {
  em_aberto: "Em aberto",
  apresentada: "Apresentada",
  decidida: "Decidida",
};
const COR: Record<string, string> = {
  em_aberto: "bg-[#E8E6DC] text-texto-2",
  apresentada: "bg-[#E0EFF5] text-[#1E5468]",
  decidida: "bg-lime-faint text-[#5C7A0E]",
};

export function SituacaoComparativo({
  id,
  situacao,
  apresentadoEm,
  decididoEm,
  propostaEscolhidaId,
  propostas,
}: {
  id: string;
  situacao: string;
  apresentadoEm: string | null;
  decididoEm: string | null;
  propostaEscolhidaId: string | null;
  propostas: ComparativoPropostaItem[];
}) {
  const escolhida = propostas.find((p) => p.id === propostaEscolhidaId);

  return (
    <section className="print:hidden bg-white border border-[color:var(--border-subtle)] rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-texto-3">Situação da comparação</span>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${COR[situacao] ?? COR.em_aberto}`}
        >
          {ROTULO[situacao] ?? "Em aberto"}
        </span>
        {situacao !== "em_aberto" && apresentadoEm && (
          <span className="text-xs text-texto-3">
            apresentada em {formatarData(apresentadoEm)}
          </span>
        )}
        {situacao === "decidida" && decididoEm && (
          <span className="text-xs text-texto-3">
            · decidida em {formatarData(decididoEm)}
          </span>
        )}
      </div>

      {/* Em aberto → apresentar */}
      {situacao === "em_aberto" && (
        <form action={apresentarComparativoAction} className="mt-4">
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="font-body font-semibold text-sm bg-lime text-ink px-4 py-2 rounded-md hover:bg-lime-deep transition-colors"
          >
            Marcar comparação como apresentada
          </button>
        </form>
      )}

      {/* Apresentada → escolher a vencedora */}
      {situacao === "apresentada" && (
        <div className="mt-4">
          <p className="text-sm text-ink font-medium mb-2">
            Qual proposta foi aceita?
          </p>
          <div className="flex flex-wrap gap-2">
            {propostas.map((p) => (
              <form action={decidirComparativoAction} key={p.id}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="proposta_escolhida_id" value={p.id} />
                <button
                  type="submit"
                  className="font-body font-semibold text-sm bg-transparent text-ink border border-[color:var(--border-strong)] px-4 py-2 rounded-md hover:bg-lime-faint hover:border-lime-deep transition-colors"
                >
                  ✓ {p.titulo}
                </button>
              </form>
            ))}
          </div>
          <p className="text-xs text-texto-3 mt-2">
            A escolhida vira <strong>Aprovada</strong>; as demais desta
            comparação viram <strong>Recusada</strong>.
          </p>
        </div>
      )}

      {/* Decidida → mostra a escolhida + reabrir */}
      {situacao === "decidida" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink">
            Proposta escolhida:{" "}
            <span className="font-semibold text-[#5C7A0E]">
              ✓ {escolhida?.titulo ?? "—"}
            </span>
          </p>
          <form action={reabrirComparativoAction}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="font-body font-semibold text-sm bg-transparent text-texto-2 border border-[color:var(--border-strong)] px-3 py-1.5 rounded-md hover:bg-paper-warm transition-colors"
            >
              Reabrir
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
