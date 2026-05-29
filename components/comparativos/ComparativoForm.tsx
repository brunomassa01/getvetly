"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Campo, CampoArea, Aviso } from "@/components/auth/Campos";
import { OverlayAnalisando } from "@/components/propostas/OverlayAnalisando";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { formatarMoeda, formatarData } from "@/lib/format";
import { gerarComparativoAction } from "@/app/(dashboard)/comparativos/actions";

interface PropostaPronta {
  id: string;
  titulo: string;
  fornecedor_nome: string | null;
  valor_negociado: string | null;
  created_at: string;
}

export function ComparativoForm({
  propostas,
}: {
  propostas: PropostaPronta[];
}) {
  const [estado, action] = useFormState(gerarComparativoAction, ESTADO_INICIAL);
  const [comparando, setComparando] = useState(false);

  useEffect(() => {
    if (estado.erro) setComparando(false);
  }, [estado]);

  return (
    <form action={action} className="space-y-5">
      <OverlayAnalisando ativo={comparando} titulo="Comparando propostas..." />

      <div>
        <p className="text-sm font-medium text-texto-2 mb-2">
          Selecione as propostas (2 ou mais)
        </p>
        <div className="space-y-2">
          {propostas.map((p) => (
            <label
              key={p.id}
              className="flex items-start gap-3 border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5 cursor-pointer hover:bg-paper-warm"
            >
              <input
                type="checkbox"
                name="propostas"
                value={p.id}
                className="w-4 h-4 mt-0.5 accent-lime-deep"
              />
              <span className="text-sm">
                <span className="block text-ink font-medium">{p.titulo}</span>
                <span className="block text-texto-3 text-xs mt-0.5">
                  {p.fornecedor_nome ?? "fornecedor não identificado"} ·{" "}
                  {formatarMoeda(p.valor_negociado)} ·{" "}
                  {formatarData(p.created_at)}
                </span>
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
        <button
          type="submit"
          onClick={() => setComparando(true)}
          className="flex-[2] font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md hover:bg-lime-deep transition-colors"
        >
          Gerar comparação
        </button>
      </div>
    </form>
  );
}
