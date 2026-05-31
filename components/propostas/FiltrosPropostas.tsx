"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { STATUS_PROPOSTA } from "@/lib/propostas/schema";
import { CATEGORIAS, ROTULO_CATEGORIA } from "@/lib/fornecedores/schema";

const baseInput =
  "bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3";

// Status úteis pro usuário filtrar (oculta 'archived').
const STATUS_FILTRAVEIS = Object.entries(STATUS_PROPOSTA).filter(
  ([k]) => k !== "archived",
);

export function FiltrosPropostas({
  buscaInicial = "",
  statusInicial = "",
  categoriaInicial = "",
  ordenarInicial = "",
}: {
  buscaInicial?: string;
  statusInicial?: string;
  categoriaInicial?: string;
  ordenarInicial?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busca, setBusca] = useState(buscaInicial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(window.location.search);
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function aoDigitar(valor: string) {
    setBusca(valor);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => atualizar("busca", valor), 300);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => aoDigitar(e.target.value)}
        placeholder="Buscar por proposta ou fornecedor..."
        className={`${baseInput} flex-1`}
      />
      <select
        defaultValue={statusInicial}
        onChange={(e) => atualizar("status", e.target.value)}
        className={baseInput}
      >
        <option value="">Todos os status</option>
        {STATUS_FILTRAVEIS.map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>
      <select
        defaultValue={categoriaInicial}
        onChange={(e) => atualizar("categoria", e.target.value)}
        className={baseInput}
      >
        <option value="">Todas as categorias</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {ROTULO_CATEGORIA[c]}
          </option>
        ))}
      </select>
      <select
        defaultValue={ordenarInicial}
        onChange={(e) => atualizar("ordenar", e.target.value)}
        className={baseInput}
      >
        <option value="">Mais recentes</option>
        <option value="valor">Maior valor</option>
        <option value="titulo">Título (A-Z)</option>
      </select>
    </div>
  );
}
