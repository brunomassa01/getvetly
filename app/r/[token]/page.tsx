import type { Metadata } from "next";
import { buscarCompartilhamentoPorToken } from "@/lib/compartilhamentos/db";
import { ROTULO_DECISAO, type Decisao } from "@/lib/compartilhamentos/schema";
import { ApresentacaoDeck } from "@/components/comparativos/ApresentacaoDeck";
import { formatarData } from "@/lib/format";
import { FormAprovacao } from "./FormAprovacao";

export const metadata: Metadata = { title: "Análise para aprovação — Vetly" };
export const dynamic = "force-dynamic";

export default async function PaginaRevisao({
  params,
}: {
  params: { token: string };
}) {
  const dados = await buscarCompartilhamentoPorToken(params.token);

  // Link inválido, expirado ou revogado.
  if (!dados) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tighter">
            Link indisponível
          </h1>
          <p className="text-sm text-texto-2 mt-2">
            Este link de aprovação não existe, expirou ou foi desativado. Peça
            um novo link a quem te enviou.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <ApresentacaoDeck {...dados.apresentacao} />

      <div className="mt-10">
        {dados.decisao ? (
          <div className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
            <h2 className="font-display font-bold text-lg text-ink">
              Decisão registrada
            </h2>
            <p className="text-sm text-ink mt-2">
              <span className="font-semibold">
                {ROTULO_DECISAO[dados.decisao.decisao as Decisao] ??
                  dados.decisao.decisao}
              </span>{" "}
              por {dados.decisao.revisor_nome} em{" "}
              {formatarData(dados.decisao.created_at)}.
            </p>
            {dados.decisao.justificativa && (
              <p className="text-sm text-texto-2 mt-2 border-l-2 border-[color:var(--border-strong)] pl-3">
                “{dados.decisao.justificativa}”
              </p>
            )}
          </div>
        ) : dados.permiteAprovar && !dados.jaDecidido ? (
          <FormAprovacao token={dados.token} />
        ) : dados.jaDecidido ? (
          <div className="bg-paper-warm border border-[color:var(--border-subtle)] rounded-lg p-5 text-center">
            <p className="text-sm text-texto-2">
              Esta análise já teve seu desfecho registrado no sistema.
            </p>
          </div>
        ) : null}
      </div>

      <footer className="mt-10 text-center">
        <span className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
          gerado por getvetly.com
        </span>
      </footer>
    </main>
  );
}
