import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ehEmailInterno } from "@/lib/auth/interno";
import { metricasAdmin } from "@/lib/admin/db";
import { definirAnalisesExtrasAction } from "./actions";
import { PLANOS_STRIPE, ANALISES_GRATIS, type Plano } from "@/lib/stripe/config";
import { formatarMoeda, formatarData } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Vetly" };
export const dynamic = "force-dynamic";

const STATUS_ROTULO: Record<string, string> = {
  trial: "Teste",
  active: "Ativo",
  past_due: "Pendente",
  canceled: "Cancelado",
};

function Metrica({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-5">
      <p className="text-sm text-texto-3">{rotulo}</p>
      <p
        className={`font-display font-extrabold tracking-tighter mt-1 ${destaque ? "text-3xl text-[#5C7A0E]" : "text-2xl text-ink"}`}
      >
        {valor}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!ehEmailInterno(session?.user?.email)) redirect("/painel");

  const m = await metricasAdmin();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-texto-2 bg-[#E8E6DC] rounded-full px-3 py-1.5">
          Painel interno
        </span>
        <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-3">
          Administrativo
        </h1>
        <p className="text-sm text-texto-2 mt-1">
          Visão de negócio do Get Vetly (todos os clientes).
        </p>
        <Link
          href="/admin/crm"
          className="inline-block mt-3 text-sm font-medium text-[#5C7A0E] hover:underline"
        >
          CRM de testes →
        </Link>
      </div>

      {/* Receita / assinaturas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metrica rotulo="MRR (R$/mês)" valor={formatarMoeda(m.mrr)} destaque />
        <Metrica rotulo="Assinantes ativos" valor={String(m.ativos)} />
        <Metrica rotulo="Em teste" valor={String(m.trials)} />
        <Metrica rotulo="Cancelados" valor={String(m.cancelados)} />
      </div>

      {/* Assinantes por plano */}
      <section className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-6">
        <h2 className="font-display font-bold text-ink text-lg mb-3">
          Assinantes ativos por plano
        </h2>
        {m.assinantesPorPlano.length === 0 ? (
          <p className="text-sm text-texto-3">Nenhum assinante ativo ainda.</p>
        ) : (
          <ul className="space-y-2">
            {m.assinantesPorPlano.map((p) => (
              <li
                key={p.plano}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink">
                  {PLANOS_STRIPE[p.plano as Plano]?.nome ?? p.plano}
                </span>
                <span className="font-display font-bold text-ink">{p.n}</span>
              </li>
            ))}
          </ul>
        )}
        {m.enterpriseAtivos > 0 && (
          <p className="text-xs text-texto-3 mt-3">
            {m.enterpriseAtivos} Enterprise ativo(s) — preço sob consulta (fora
            do MRR automático).
          </p>
        )}
      </section>

      {/* Uso */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metrica rotulo="Empresas" valor={String(m.workspaces)} />
        <Metrica rotulo="Usuários" valor={String(m.usuarios)} />
        <Metrica rotulo="Análises" valor={String(m.analises)} />
        <Metrica
          rotulo="Custo IA (acum.)"
          valor={`US$ ${m.custoIaUsd.toFixed(2)}`}
        />
      </div>

      {/* Origem dos cadastros (UTM da campanha) */}
      <section className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-6">
        <h2 className="font-display font-bold text-ink text-lg mb-3">
          Origem dos cadastros
        </h2>
        {m.origens.length === 0 ? (
          <p className="text-sm text-texto-3">Sem cadastros ainda.</p>
        ) : (
          <ul className="space-y-2">
            {m.origens.map((o, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink">{o.origem}</span>
                <span className="font-display font-bold text-ink">{o.n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Empresas recentes */}
      <section className="rounded-xl border border-[color:var(--border-subtle)] bg-white overflow-hidden">
        <h2 className="font-display font-bold text-ink text-lg px-6 pt-6 pb-3">
          Empresas recentes
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-paper-warm">
            <tr className="text-left text-texto-3 text-xs uppercase tracking-wide">
              <th className="px-6 py-2 font-semibold">Empresa</th>
              <th className="px-6 py-2 font-semibold">E-mail</th>
              <th className="px-6 py-2 font-semibold">Status</th>
              <th className="px-6 py-2 font-semibold">Plano</th>
              <th className="px-6 py-2 font-semibold">Teste grátis</th>
              <th className="px-6 py-2 font-semibold">Criada</th>
            </tr>
          </thead>
          <tbody>
            {m.recentes.map((r) => (
              <tr key={r.id} className="border-t border-[color:var(--border-subtle)]">
                <td className="px-6 py-3 text-ink font-medium">{r.nome}</td>
                <td className="px-6 py-3 text-texto-2">{r.email ?? "—"}</td>
                <td className="px-6 py-3 text-texto-2">
                  {STATUS_ROTULO[r.status] ?? r.status}
                </td>
                <td className="px-6 py-3 text-texto-2">
                  {r.plano ? (PLANOS_STRIPE[r.plano as Plano]?.nome ?? r.plano) : "—"}
                </td>
                <td className="px-6 py-3">
                  {r.status === "active" ? (
                    <span className="text-texto-3">—</span>
                  ) : (
                    <form
                      action={definirAnalisesExtrasAction}
                      className="flex items-center gap-1.5"
                    >
                      <input type="hidden" name="workspaceId" value={r.id} />
                      <span
                        className="text-xs text-texto-3 whitespace-nowrap"
                        title={`${r.analises_usadas} análises usadas de ${ANALISES_GRATIS} + extra`}
                      >
                        {r.analises_usadas}/{ANALISES_GRATIS}+
                      </span>
                      <input
                        type="number"
                        name="extra"
                        min={0}
                        max={999}
                        defaultValue={r.analises_gratis_extra}
                        aria-label={`Análises extras de ${r.nome}`}
                        className="w-16 rounded-md border border-[color:var(--border-default)] px-2 py-1 text-sm text-ink"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-[#5C7A0E] hover:underline"
                      >
                        Salvar
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-6 py-3 text-texto-3">
                  {formatarData(r.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
