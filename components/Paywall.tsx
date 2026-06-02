import Link from "next/link";

/**
 * Card amigável mostrado quando a empresa esgotou o teste grátis.
 * Convida a conhecer os planos em vez de exibir um erro.
 */
export function Paywall({
  titulo = "Você aproveitou suas análises grátis 🎉",
  descricao = "Para continuar analisando propostas sem limite — com comparação, apresentação e link de aprovação — escolha um plano. Leva 1 minuto.",
}: {
  titulo?: string;
  descricao?: string;
}) {
  return (
    <div className="bg-white border border-[color:var(--border-subtle)] rounded-2xl p-8 text-center">
      <div className="mx-auto h-1.5 w-10 rounded-full bg-lime mb-5" />
      <h2 className="font-display font-extrabold text-ink text-xl sm:text-2xl tracking-tight">
        {titulo}
      </h2>
      <p className="mt-3 text-texto-2 max-w-md mx-auto leading-relaxed">
        {descricao}
      </p>
      <Link
        href="/financeiro"
        className="mt-7 inline-block font-body font-semibold text-sm bg-lime text-ink px-7 py-3 rounded-md hover:bg-lime-deep transition-colors"
      >
        Ver planos e assinar
      </Link>
      <p className="mt-3 text-xs text-texto-3">
        Sem fidelidade — cancele quando quiser.
      </p>
    </div>
  );
}
