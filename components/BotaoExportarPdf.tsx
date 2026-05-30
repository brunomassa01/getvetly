"use client";

export function BotaoExportarPdf() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden font-body font-semibold text-sm bg-transparent text-ink px-4 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
    >
      Exportar PDF
    </button>
  );
}
