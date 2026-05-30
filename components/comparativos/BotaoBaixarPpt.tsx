"use client";

import { useRef, useState } from "react";

/**
 * Baixa o PPT do comparativo via fetch, mostrando uma barra de progresso
 * dentro do botão. Como a IA compõe o roteiro (alguns segundos), o usuário
 * precisa de feedback — e o botão fica desabilitado para não disparar várias vezes.
 */
export function BotaoBaixarPpt({ comparativoId }: { comparativoId: string }) {
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function pararTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function baixar() {
    if (gerando) return;
    setGerando(true);
    setProgresso(8);

    // Progresso simulado: avança até ~92% enquanto a IA monta a apresentação.
    timerRef.current = setInterval(() => {
      setProgresso((p) => (p < 92 ? p + Math.random() * 6 : p));
    }, 400);

    try {
      const resp = await fetch(`/comparativos/${comparativoId}/pptx`);
      if (!resp.ok) throw new Error("Falha ao gerar a apresentação.");

      const blob = await resp.blob();
      const dispo = resp.headers.get("Content-Disposition") ?? "";
      const m = dispo.match(/filename="?([^"]+)"?/);
      const nome = m?.[1] ?? "apresentacao.pptx";

      pararTimer();
      setProgresso(100);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setGerando(false);
        setProgresso(0);
      }, 600);
    } catch {
      pararTimer();
      setGerando(false);
      setProgresso(0);
      alert("Não consegui gerar a apresentação agora. Tente de novo.");
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={gerando}
      className="print:hidden relative overflow-hidden font-body font-semibold text-sm bg-transparent text-ink px-4 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors disabled:cursor-wait disabled:opacity-90"
    >
      <span className="inline-flex items-center gap-2">
        {gerando && (
          <span
            className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-spin"
            aria-hidden
          />
        )}
        {gerando ? "Gerando apresentação…" : "Baixar PPT"}
      </span>

      {/* barra de progresso na base do botão */}
      {gerando && (
        <span
          className="absolute bottom-0 left-0 h-1 bg-lime transition-all duration-300 ease-out"
          style={{ width: `${progresso}%` }}
          aria-hidden
        />
      )}
    </button>
  );
}
