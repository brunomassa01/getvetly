"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const baseInput =
  "bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3";

export function BuscaComparativos({ buscaInicial = "" }: { buscaInicial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busca, setBusca] = useState(buscaInicial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function aoDigitar(valor: string) {
    setBusca(valor);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (valor) params.set("busca", valor);
      else params.delete("busca");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <input
      type="search"
      value={busca}
      onChange={(e) => aoDigitar(e.target.value)}
      placeholder="Buscar por título ou fornecedor..."
      className={`${baseInput} w-full`}
    />
  );
}
