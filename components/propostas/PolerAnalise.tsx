"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Enquanto a proposta está "processando", atualiza a página em intervalos para
 * pegar o resultado assim que a análise (que roda em segundo plano) terminar.
 * Como só é renderizado no estado "processando", para sozinho quando fica pronta.
 */
export function PolerAnalise({ intervaloMs = 4000 }: { intervaloMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervaloMs);
    return () => clearInterval(t);
  }, [router, intervaloMs]);
  return null;
}
