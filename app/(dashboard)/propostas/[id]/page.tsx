import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarProposta, buscarAnalise } from "@/lib/propostas/db";
import { STATUS_PROPOSTA } from "@/lib/propostas/schema";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { formatarMoeda, formatarData, formatarTamanho } from "@/lib/format";
import { BotaoAnalisar } from "@/components/propostas/BotaoAnalisar";
import { RelatorioAnalise } from "@/components/propostas/RelatorioAnalise";
import { CompletarContatoFornecedor } from "@/components/propostas/CompletarContatoFornecedor";
import { SituacaoProposta } from "@/components/propostas/SituacaoProposta";
import { WhitelabelHeader } from "@/components/WhitelabelHeader";
import { BotaoBaixarPpt } from "@/components/comparativos/BotaoBaixarPpt";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";

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
  const analise = await buscarAnalise(userId, params.id);
  const workspace = await buscarWorkspaceDoUsuario(userId);

  // Há fornecedor vinculado mas faltam dados básicos de contato?
  const contatoIncompleto =
    !!proposta.fornecedor_id &&
    (!proposta.fornecedor_cnpj ||
      !proposta.fornecedor_email ||
      !proposta.fornecedor_telefone);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <WhitelabelHeader workspace={workspace} />
      <div>
        <Link
          href="/propostas"
          className="print:hidden text-sm text-texto-2 hover:text-ink"
        >
          ← Voltar
        </Link>
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
              {proposta.titulo}
            </h1>
            <span className="print:hidden inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E8E6DC] text-texto-2">
              {STATUS_PROPOSTA[proposta.status] ?? proposta.status}
            </span>
          </div>
          {analise && (
            <div className="print:hidden flex gap-2 shrink-0">
              <BotaoBaixarPpt url={`/propostas/${params.id}/pptx`} />
              <Link
                href={`/propostas/${params.id}/apresentacao`}
                className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
              >
                Apresentação / PDF
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Situação comercial (ciclo de aprovação) */}
      {proposta.status === "ready" && (
        <SituacaoProposta
          id={proposta.id}
          situacao={proposta.situacao}
          apresentadaEm={proposta.apresentada_em}
          decididaEm={proposta.decidida_em}
        />
      )}

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

      {/* Análise por IA */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display font-extrabold text-ink text-xl tracking-tighter">
            Análise por IA
          </h2>
          {proposta.arquivos.length > 0 && (
            <div className="print:hidden">
            <BotaoAnalisar
              propostaId={proposta.id}
              rotular={
                analise || proposta.status === "failed"
                  ? "Refazer análise"
                  : "Analisar com IA"
              }
            />
            </div>
          )}
        </div>

        {analise ? (
          <div className="space-y-6">
            {contatoIncompleto && proposta.fornecedor_id && (
              <CompletarContatoFornecedor
                propostaId={proposta.id}
                fornecedorId={proposta.fornecedor_id}
                fornecedorNome={proposta.fornecedor_nome}
                cnpj={proposta.fornecedor_cnpj}
                email={proposta.fornecedor_email}
                telefone={proposta.fornecedor_telefone}
              />
            )}
            <RelatorioAnalise analise={analise} />
          </div>
        ) : (
          <div className="bg-paper-warm border border-[color:var(--border-subtle)] rounded-lg p-6 text-center">
            {proposta.status === "failed" ? (
              <div className="text-sm text-danger">
                <p className="font-medium">A última análise falhou.</p>
                {proposta.status_message && (
                  <p className="mt-1 text-texto-2">
                    Motivo: {proposta.status_message}
                  </p>
                )}
                <p className="mt-1 text-texto-3 text-xs">
                  Clique em &quot;Refazer análise&quot; para tentar de novo.
                </p>
              </div>
            ) : proposta.arquivos.length === 0 ? (
              <p className="text-sm text-texto-2">
                Anexe ao menos um arquivo (PDF com texto) para analisar.
              </p>
            ) : (
              <p className="text-sm text-texto-2">
                Clique em <strong>Analisar com IA</strong> para gerar o
                relatório com leitura crítica desta proposta.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
