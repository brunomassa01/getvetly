"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORIAS, ROTULO_CATEGORIA } from "@/lib/fornecedores/schema";

const baseInput =
  "bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3";

export function BuscaFornecedores({
  buscaInicial = "",
  categoriaInicial = "",
}: {
  buscaInicial?: string;
  categoriaInicial?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busca, setBusca] = useState(buscaInicial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function atualizarUrl(novaBusca: string, novaCategoria?: string) {
    const params = new URLSearchParams(window.location.search);
    if (novaBusca) params.set("busca", novaBusca);
    else params.delete("busca");
    if (novaCategoria !== undefined) {
      if (novaCategoria) params.set("categoria", novaCategoria);
      else params.delete("categoria");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function aoDigitar(valor: string) {
    setBusca(valor);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => atualizarUrl(valor), 300);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => aoDigitar(e.target.value)}
        placeholder="Buscar por nome..."
        className={`${baseInput} flex-1`}
      />
      <select
        defaultValue={categoriaInicial}
        onChange={(e) => atualizarUrl(busca, e.target.value)}
        className={baseInput}
      >
        <option value="">Todas as categorias</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {ROTULO_CATEGORIA[c]}
          </option>
        ))}
      </select>
    </div>
  );
}
