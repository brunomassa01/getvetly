"use client";

import { mesclarFornecedoresAction } from "@/app/(dashboard)/fornecedores/actions";

export interface FornecedorMini {
  id: string;
  nome: string;
  cotacoes: number;
}

function GrupoForm({ fornecedores }: { fornecedores: FornecedorMini[] }) {
  const nomes = fornecedores.map((f) => f.nome).join(", ");
  return (
    <form
      action={mesclarFornecedoresAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Mesclar ${fornecedores.length} fornecedores (${nomes}) em um só? As propostas dos demais passam para o principal. Esta ação não pode ser desfeita pela tela.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="rounded-lg border border-[color:var(--border-subtle)] bg-white p-4"
    >
      <p className="text-xs text-texto-3 mb-2 uppercase tracking-wide font-semibold">
        Escolha o fornecedor principal
      </p>
      <div className="space-y-1.5">
        {fornecedores.map((f, idx) => (
          <label key={f.id} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="principalId"
              value={f.id}
              defaultChecked={idx === 0}
              className="accent-ink"
            />
            <span className="font-medium">{f.nome}</span>
            <span className="text-texto-3">· {f.cotacoes} cotações</span>
          </label>
        ))}
      </div>
      {fornecedores.map((f) => (
        <input key={f.id} type="hidden" name="ids" value={f.id} />
      ))}
      <button
        type="submit"
        className="mt-3 font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
      >
        Mesclar em 1 fornecedor
      </button>
    </form>
  );
}

export function DuplicadosFornecedores({
  grupos,
}: {
  grupos: { fornecedores: FornecedorMini[] }[];
}) {
  if (grupos.length === 0) return null;
  return (
    <section className="rounded-xl border border-[color:var(--border-default)] bg-paper-warm p-5">
      <h2 className="font-display font-bold text-ink text-lg">
        Possíveis duplicados ({grupos.length})
      </h2>
      <p className="text-sm text-texto-2 mt-1 mb-4">
        Encontramos fornecedores com nomes muito parecidos — provavelmente o
        mesmo. Escolha o principal e mescle: as propostas dos demais passam para
        ele e os duplicados são arquivados.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {grupos.map((g, i) => (
          <GrupoForm key={i} fornecedores={g.fornecedores} />
        ))}
      </div>
    </section>
  );
}
