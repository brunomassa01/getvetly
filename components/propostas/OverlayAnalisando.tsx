"use client";

import { useEffect, useState } from "react";

const MENSAGENS = [
  "Lendo os documentos da proposta...",
  "Extraindo fornecedor, contato e valores...",
  "Avaliando pontos fortes e riscos...",
  "Montando o relatório com leitura crítica...",
];

/**
 * Overlay de tela cheia exibido enquanto a análise roda.
 * Controlado pela prop `ativo` — fica visível do clique até a navegação final,
 * cobrindo toda a análise (sem sumir cedo no redirecionamento).
 */
export function OverlayAnalisando({
  ativo,
  titulo = "Analisando sua proposta",
}: {
  ativo: boolean;
  titulo?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!ativo) {
      setI(0);
      return;
    }
    const t = setInterval(() => setI((x) => (x + 1) % MENSAGENS.length), 2500);
    return () => clearInterval(t);
  }, [ativo]);

  if (!ativo) return null;
  return (
    <div className="fixed inset-0 z-50 bg-paper/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-lime-soft border-t-lime-deep animate-spin" />
      <p className="mt-6 font-display font-extrabold text-xl text-ink tracking-tighter">
        {titulo}
      </p>
      <p className="mt-2 text-sm text-texto-2 min-h-5">{MENSAGENS[i]}</p>
      <p className="mt-1 text-xs text-texto-3">
        Isso pode levar alguns minutos. Não feche a página.
      </p>
    </div>
  );
}
