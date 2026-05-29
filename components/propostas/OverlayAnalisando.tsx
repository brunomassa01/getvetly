"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

const MENSAGENS = [
  "Lendo o documento da proposta...",
  "Extraindo fornecedor, contato e valores...",
  "Avaliando pontos fortes e riscos...",
  "Montando o relatório com leitura crítica...",
];

/**
 * Overlay de tela cheia exibido enquanto a análise roda. Lê o estado do form
 * ancestral via useFormStatus — renderize dentro do <form> que dispara a ação.
 */
export function OverlayAnalisando({
  titulo = "Analisando sua proposta",
}: {
  titulo?: string;
}) {
  const { pending } = useFormStatus();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!pending) {
      setI(0);
      return;
    }
    const t = setInterval(() => setI((x) => (x + 1) % MENSAGENS.length), 2500);
    return () => clearInterval(t);
  }, [pending]);

  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-50 bg-paper/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-lime-soft border-t-lime-deep animate-spin" />
      <p className="mt-6 font-display font-extrabold text-xl text-ink tracking-tighter">
        {titulo}
      </p>
      <p className="mt-2 text-sm text-texto-2 min-h-5">{MENSAGENS[i]}</p>
      <p className="mt-1 text-xs text-texto-3">
        Pode levar até 1 minuto. Não feche a página.
      </p>
    </div>
  );
}
