"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Campo, CampoArea, Aviso } from "@/components/auth/Campos";
import { OverlayAnalisando } from "@/components/propostas/OverlayAnalisando";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { gerarComparativoAction } from "@/app/(dashboard)/comparativos/actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md transition-colors hover:bg-lime-deep disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Comparando..." : "Gerar comparação"}
    </button>
  );
}

export function ComparativoForm({
  propostas,
}: {
  propostas: { id: string; titulo: string; fornecedor_nome: string | null }[];
}) {
  const [estado, action] = useFormState(gerarComparativoAction, ESTADO_INICIAL);

  return (
    <form action={action} className="space-y-5">
      <OverlayAnalisando titulo="Comparando propostas..." />

      <div>
        <p className="text-sm font-medium text-texto-2 mb-2">
          Selecione as propostas (2 ou mais)
        </p>
        <div className="space-y-2">
          {propostas.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5 cursor-pointer hover:bg-paper-warm"
            >
              <input
                type="checkbox"
                name="propostas"
                value={p.id}
                className="w-4 h-4 accent-lime-deep"
              />
              <span className="text-sm text-ink">
                {p.titulo}
                {p.fornecedor_nome ? (
                  <span className="text-texto-3"> · {p.fornecedor_nome}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </div>

      <CampoArea
        label="O que mais importa nesta decisão?"
        name="criterios"
        placeholder="Ex.: menor preço com bom alcance; prazo de pagamento mais longo; menor risco contratual"
      />

      <Campo label="Título da comparação (opcional)" name="titulo" />

      <Aviso erro={estado.erro} />

      <div className="flex gap-3 pt-1">
        <Link
          href="/comparativos"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <div className="flex-[2]">
          <Botao />
        </div>
      </div>
    </form>
  );
}
