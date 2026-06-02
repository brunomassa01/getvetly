import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { usuarioAtual } from "@/lib/auth/sessao";
import { contagensPainel } from "@/lib/workspace/db";
import { ehAdmin } from "@/lib/workspace/membros";
import { resumoSituacao, listarAguardandoRetorno } from "@/lib/propostas/db";
import { marcarSituacaoAction } from "@/app/(dashboard)/propostas/actions";
import { OnboardingNovo } from "@/components/painel/OnboardingNovo";

export const metadata: Metadata = { title: "Painel — Vetly" };
export const dynamic = "force-dynamic";

function CardLink({
  href,
  titulo,
  descricao,
  contagem,
}: {
  href: string;
  titulo: string;
  descricao: string;
  contagem?: number;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-[color:var(--border-subtle)] rounded-xl p-5 hover:border-lime-deep hover:shadow-md transition-all"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display font-bold text-ink">{titulo}</span>
        {contagem !== undefined && (
          <span className="font-display font-extrabold text-2xl text-ink tracking-tighter">
            {contagem}
          </span>
        )}
      </div>
      <p className="text-sm text-texto-2 mt-1">{descricao}</p>
    </Link>
  );
}

export default async function PainelPage() {
  const userId = await usuarioAtual();
  const session = await auth();
  const nome = session?.user?.name ?? session?.user?.email ?? "você";
  const admin = await ehAdmin(userId);
  const contagens = await contagensPainel(userId);
  const contaVazia =
    contagens.propostas === 0 &&
    contagens.comparativos === 0 &&
    contagens.fornecedores === 0;
  const resumo = await resumoSituacao(userId);
  const aguardando = await listarAguardandoRetorno(userId);
  const apresentadasTotal = resumo.apresentada + resumo.aprovada + resumo.recusada;
  const taxa =
    apresentadasTotal > 0
      ? Math.round((resumo.aprovada / apresentadasTotal) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3 py-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
          Conta ativa
        </span>
        <h1 className="font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Olá, {nome}.
        </h1>
        <p className="mt-2 text-base text-texto-2">
          Analise propostas comerciais com leitura crítica por IA.
        </p>
      </div>

      {/* Guia de primeiro acesso — só quando a conta ainda está vazia */}
      {contaVazia && <OnboardingNovo />}

      {/* Ação principal — propósito do Vetly */}
      <Link
        href="/propostas/nova"
        className="block rounded-xl bg-ink text-paper p-6 sm:p-8 hover:bg-black transition-colors"
      >
        <span className="font-mono text-[11px] tracking-wide2 uppercase text-lime">
          Comece por aqui
        </span>
        <p className="font-display font-extrabold text-2xl sm:text-3xl tracking-tighter mt-2">
          Analisar nova proposta →
        </p>
        <p className="text-sm text-paper/70 mt-2 max-w-lg">
          Suba o(s) arquivo(s) do fornecedor — a IA extrai os dados e entrega um
          relatório com leitura crítica.
        </p>
      </Link>

      {/* Índice de propostas (ciclo comercial) — visão gerencial (admin) */}
      {admin && (
        <section className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6">
        <p className="text-base text-ink">
          Você apresentou{" "}
          <strong className="font-display font-extrabold">
            {apresentadasTotal}
          </strong>{" "}
          {apresentadasTotal === 1 ? "proposta" : "propostas"}, fechou{" "}
          <strong className="font-display font-extrabold text-[#5C7A0E]">
            {resumo.aprovada}
          </strong>
          , e{" "}
          <strong className="font-display font-extrabold text-[#1E5468]">
            {resumo.apresentada}
          </strong>{" "}
          {resumo.apresentada === 1 ? "aguarda" : "aguardam"} retorno.
          {taxa !== null && (
            <span className="text-texto-2">
              {" "}
              Taxa de aprovação: <strong>{taxa}%</strong>.
            </span>
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { rotulo: "Em aberto", valor: resumo.em_aberto, cor: "text-texto-2" },
            { rotulo: "Apresentadas", valor: resumo.apresentada, cor: "text-[#1E5468]" },
            { rotulo: "Aprovadas", valor: resumo.aprovada, cor: "text-[#5C7A0E]" },
            { rotulo: "Recusadas", valor: resumo.recusada, cor: "text-[#8E2828]" },
          ].map((m) => (
            <div
              key={m.rotulo}
              className="rounded-lg bg-paper-warm px-4 py-3 text-center"
            >
              <div className={`font-display font-extrabold text-2xl ${m.cor}`}>
                {m.valor}
              </div>
              <div className="text-xs text-texto-3 mt-0.5">{m.rotulo}</div>
            </div>
          ))}
        </div>
        </section>
      )}

      {/* Aguardando retorno (lembrete) — admin */}
      {admin && aguardando.length > 0 && (
        <section className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6">
          <h2 className="font-display font-bold text-ink text-lg">
            Aguardando retorno ({aguardando.length})
          </h2>
          <p className="text-sm text-texto-2 mt-0.5 mb-4">
            Propostas que você apresentou e ainda não tiveram desfecho. Já teve
            resposta?
          </p>
          <ul className="space-y-2">
            {aguardando.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border-subtle)] px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/propostas/${p.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {p.titulo}
                  </Link>
                  <span className="text-texto-3 text-sm">
                    {p.fornecedor_nome ? ` · ${p.fornecedor_nome}` : ""} · há{" "}
                    {p.dias} {p.dias === 1 ? "dia" : "dias"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={marcarSituacaoAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="situacao" value="aprovada" />
                    <button
                      type="submit"
                      className="font-body font-semibold text-xs bg-lime text-ink px-3 py-1.5 rounded-md hover:bg-lime-deep transition-colors"
                    >
                      ✓ Aprovada
                    </button>
                  </form>
                  <form action={marcarSituacaoAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="situacao" value="recusada" />
                    <button
                      type="submit"
                      className="font-body font-semibold text-xs bg-[#FBE3E3] text-[#8E2828] px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                    >
                      ✕ Recusada
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Atalhos */}
      <div className="grid sm:grid-cols-3 gap-4">
        <CardLink
          href="/propostas"
          titulo="Propostas"
          descricao="Veja e analise suas propostas"
          contagem={contagens.propostas}
        />
        <CardLink
          href="/comparativos"
          titulo="Comparativos"
          descricao="Compare e decida pelo seu critério"
          contagem={contagens.comparativos}
        />
        <CardLink
          href="/fornecedores"
          titulo="Fornecedores"
          descricao="Histórico de quem já cotou"
          contagem={contagens.fornecedores}
        />
      </div>

      {/* Configurar empresa */}
      <CardLink
        href="/configuracoes"
        titulo="Configurar empresa"
        descricao="Nome, CNPJ, segmento e marca dos relatórios"
      />
    </div>
  );
}
