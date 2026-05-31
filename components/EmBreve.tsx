import Link from "next/link";

/** Placeholder consistente para seções ainda em construção. */
export function EmBreve({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="max-w-xl mx-auto text-center py-20">
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-texto-2 bg-paper-warm border border-[color:var(--border-subtle)] rounded-full px-3 py-1.5 mb-5">
        Em breve
      </span>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
        {titulo}
      </h1>
      <p className="text-sm text-texto-2 mt-2">{descricao}</p>
      <Link
        href="/painel"
        className="inline-block mt-6 font-body font-semibold text-sm bg-transparent text-ink px-5 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
      >
        ← Voltar ao painel
      </Link>
    </div>
  );
}
