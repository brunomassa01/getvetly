import type { Metadata } from "next";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarAssinatura } from "@/lib/stripe/assinatura";
import { PLANOS, PLANOS_STRIPE, ANALISES_GRATIS, type Plano } from "@/lib/stripe/config";
import { assinarAction, gerenciarAssinaturaAction } from "./actions";

export const metadata: Metadata = { title: "Financeiro — Vetly" };
export const dynamic = "force-dynamic";

const STATUS_ROTULO: Record<string, string> = {
  trial: "Teste grátis",
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
};

const ITENS_PLANO: Record<Plano, string[]> = {
  starter: ["1 a 2 usuários", "~20 análises/mês"],
  pro: ["Até 5 usuários", "~80 análises/mês"],
  business: ["Até 15 usuários", "~250 análises/mês"],
  enterprise: ["Usuários ilimitados", "Volume sob medida"],
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const userId = await usuarioAtual();
  const assinatura = await buscarAssinatura(userId);
  const ativo = assinatura?.status === "active";
  const planoAtual = (assinatura?.plano ?? null) as Plano | null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
          Financeiro
        </h1>
        <p className="text-sm text-texto-2 mt-1">
          Seu plano, cobrança e faturas.
        </p>
      </div>

      {searchParams.sucesso && (
        <p className="bg-lime-faint border border-lime-deep/30 rounded-lg p-4 text-sm text-[#5C7A0E] font-medium">
          Assinatura confirmada! Obrigado. Pode levar alguns segundos para
          atualizar aqui.
        </p>
      )}
      {searchParams.erro && (
        <p className="bg-[#FDECEC] border border-danger/30 rounded-lg p-4 text-sm text-danger">
          Não consegui concluir agora. Tente novamente em instantes.
        </p>
      )}

      {/* Situação atual */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-texto-3">Plano atual</p>
            <p className="font-display font-bold text-ink text-xl mt-0.5">
              {ativo && planoAtual ? PLANOS_STRIPE[planoAtual].nome : "Teste grátis"}
            </p>
          </div>
          <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-[#E8E6DC] text-texto-2">
            {STATUS_ROTULO[assinatura?.status ?? "trial"] ?? "Teste grátis"}
          </span>
        </div>

        {!ativo && (
          <p className="text-sm text-texto-2 mt-3">
            Você está no teste grátis ({ANALISES_GRATIS} análises). Assine um
            plano abaixo para continuar sem limite de teste.
          </p>
        )}

        {ativo && (
          <form action={gerenciarAssinaturaAction} className="mt-4">
            <button
              type="submit"
              className="font-body font-semibold text-sm bg-transparent text-ink border border-[color:var(--border-strong)] px-4 py-2 rounded-md hover:bg-paper-warm transition-colors"
            >
              Gerenciar assinatura
            </button>
          </form>
        )}
      </section>

      {/* Planos */}
      <section>
        <h2 className="font-display font-extrabold text-ink text-xl tracking-tighter mb-4">
          Planos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANOS.map((plano) => {
            const info = PLANOS_STRIPE[plano];
            const atual = ativo && planoAtual === plano;
            return (
              <div
                key={plano}
                className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-5 flex flex-col"
              >
                <h3 className="font-display font-bold text-ink text-lg">
                  {info.nome}
                </h3>
                <p className="font-display font-extrabold text-2xl tracking-tighter mt-1">
                  {info.preco}
                </p>
                <ul className="mt-3 space-y-1.5 flex-1">
                  {ITENS_PLANO[plano].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-texto-2">
                      <span className="text-lime-deep">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {plano === "enterprise" ? (
                  <a
                    href="mailto:contato@getvetly.com"
                    className="mt-4 text-center font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                  >
                    Falar com vendas
                  </a>
                ) : atual ? (
                  <span className="mt-4 text-center font-body font-semibold text-sm bg-lime-faint text-[#5C7A0E] px-4 py-2 rounded-md">
                    Plano atual
                  </span>
                ) : (
                  <form action={assinarAction} className="mt-4">
                    <input type="hidden" name="plano" value={plano} />
                    <button
                      type="submit"
                      className="w-full font-body font-semibold text-sm bg-lime text-ink px-4 py-2 rounded-md hover:bg-lime-deep transition-colors"
                    >
                      {ativo ? "Trocar para este" : "Assinar"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
