import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarProposta } from "@/lib/propostas/db";
import { STATUS_PROPOSTA } from "@/lib/propostas/schema";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { formatarMoeda, formatarData, formatarTamanho } from "@/lib/format";

export const metadata: Metadata = { title: "Proposta — Vetly" };
export const dynamic = "force-dynamic";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-[color:var(--border-subtle)] last:border-0">
      <span className="text-sm text-texto-3">{rotulo}</span>
      <span className="text-sm text-ink font-medium text-right">{valor}</span>
    </div>
  );
}

export default async function PropostaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await usuarioAtual();
  const proposta = await buscarProposta(userId, params.id);
  if (!proposta) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/propostas" className="text-sm text-texto-2 hover:text-ink">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
            {proposta.titulo}
          </h1>
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E8E6DC] text-texto-2">
            {STATUS_PROPOSTA[proposta.status] ?? proposta.status}
          </span>
        </div>
      </div>

      {/* Dados da proposta */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-2">
          Dados
        </h2>
        <Linha
          rotulo="Fornecedor"
          valor={proposta.fornecedor_nome ?? "—"}
        />
        <Linha
          rotulo="Categoria"
          valor={
            ROTULO_CATEGORIA[proposta.categoria as Categoria] ??
            proposta.categoria
          }
        />
        <Linha rotulo="Escopo" valor={proposta.escopo ?? "—"} />
        <Linha
          rotulo="Valor de tabela"
          valor={formatarMoeda(proposta.valor_tabela)}
        />
        <Linha
          rotulo="Valor negociado"
          valor={formatarMoeda(proposta.valor_negociado)}
        />
        <Linha
          rotulo="Aprovador"
          valor={proposta.aprovador_email ?? "—"}
        />
        <Linha rotulo="Criada em" valor={formatarData(proposta.created_at)} />
      </section>

      {/* Arquivos */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
        <h2 className="font-display font-bold text-lg text-ink mb-3">
          Arquivos ({proposta.arquivos.length})
        </h2>
        {proposta.arquivos.length === 0 ? (
          <p className="text-sm text-texto-3">Nenhum arquivo anexado.</p>
        ) : (
          <ul className="space-y-2">
            {proposta.arquivos.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 text-sm border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5"
              >
                <span className="text-ink truncate">{a.nome_original}</span>
                <span className="text-texto-3 shrink-0">
                  {formatarTamanho(a.tamanho_bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Análise (próxima etapa) */}
      <section className="bg-paper-warm border border-[color:var(--border-subtle)] rounded-lg p-6 text-center">
        <p className="font-display font-bold text-ink">Análise por IA</p>
        <p className="text-sm text-texto-2 mt-1">
          O motor de análise (OCR + Claude) entra na próxima etapa. Em breve
          esta proposta vira um relatório com leitura crítica.
        </p>
      </section>
    </div>
  );
}
