import type { Analise } from "@/lib/ai/schema";
import { formatarMoeda } from "@/lib/format";

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6">
      <h2 className="font-display font-bold text-lg text-ink mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

const CONFIANCA: Record<string, string> = {
  alta: "Confiança alta",
  media: "Confiança média",
  baixa: "Confiança baixa",
};

export function RelatorioAnalise({ analise }: { analise: Analise }) {
  const { fornecedor, valores, analise: critica, itens, metricas, metadata } =
    analise;
  const contato = fornecedor?.contato ?? null;

  return (
    <div className="space-y-6">
      {/* Resumo executivo */}
      <Secao titulo="Resumo executivo">
        <p className="text-sm text-texto-1 leading-relaxed">
          {critica.resumo_executivo}
        </p>
      </Secao>

      {/* Fornecedor */}
      <Secao titulo="Fornecedor">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-2">
            <span className="text-sm text-texto-3">Nome</span>
            <span className="text-sm text-ink font-medium text-right">
              {fornecedor?.nome ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-2">
            <span className="text-sm text-texto-3">CNPJ</span>
            <span className="text-sm text-ink font-medium text-right">
              {fornecedor?.cnpj ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-2">
            <span className="text-sm text-texto-3">Contato</span>
            <span className="text-sm text-ink font-medium text-right">
              {contato?.nome ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-2">
            <span className="text-sm text-texto-3">E-mail</span>
            <span className="text-sm text-ink font-medium text-right">
              {contato?.email ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-texto-3">Telefone</span>
            <span className="text-sm text-ink font-medium text-right">
              {contato?.telefone ?? "—"}
            </span>
          </div>
        </div>
        <p className="text-xs text-texto-3 mt-3">
          Este fornecedor foi cadastrado/vinculado automaticamente ao seu
          histórico.
        </p>
      </Secao>

      {/* Pontos fortes e a questionar */}
      <div className="grid md:grid-cols-2 gap-6">
        <Secao titulo="Pontos fortes">
          {critica.pros.length === 0 ? (
            <p className="text-sm text-texto-3">—</p>
          ) : (
            <ul className="space-y-2">
              {critica.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-texto-1">
                  <span className="text-lime-deep font-bold">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Pontos a questionar">
          {critica.questionar.length === 0 ? (
            <p className="text-sm text-texto-3">—</p>
          ) : (
            <ul className="space-y-2">
              {critica.questionar.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm text-texto-1">
                  <span className="text-warning font-bold">!</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>

      {/* Valores */}
      <Secao titulo="Valores">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-texto-3">Tabela</p>
            <p className="font-display font-bold text-lg text-ink">
              {formatarMoeda(valores.tabela_total)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-texto-3">
              Negociado
            </p>
            <p className="font-display font-bold text-lg text-ink">
              {formatarMoeda(valores.negociado_total)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-texto-3">
              Desconto
            </p>
            <p className="font-display font-bold text-lg text-ink">
              {valores.desconto_pct != null
                ? `${valores.desconto_pct.toLocaleString("pt-BR")}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-texto-3">
              Economia
            </p>
            <p className="font-display font-bold text-lg text-[#5C7A0E]">
              {formatarMoeda(valores.economia)}
            </p>
          </div>
        </div>
      </Secao>

      {/* Itens */}
      {itens.length > 0 && (
        <Secao titulo={`Itens (${itens.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-texto-3 text-xs uppercase tracking-wide border-b border-[color:var(--border-subtle)]">
                  <th className="py-2 pr-4 font-semibold">Descrição</th>
                  <th className="py-2 px-4 font-semibold">Qtd</th>
                  <th className="py-2 px-4 font-semibold">Unit. negociado</th>
                  <th className="py-2 pl-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-[color:var(--border-subtle)] last:border-0"
                  >
                    <td className="py-2 pr-4 text-ink">{item.descricao}</td>
                    <td className="py-2 px-4 text-texto-2">
                      {item.quantidade ?? "—"}
                    </td>
                    <td className="py-2 px-4 text-texto-2">
                      {formatarMoeda(item.valor_unitario_negociado)}
                    </td>
                    <td className="py-2 pl-4 text-texto-2">
                      {formatarMoeda(item.valor_total_negociado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      {/* Métricas */}
      {metricas.length > 0 && (
        <Secao titulo="Métricas">
          <div className="grid sm:grid-cols-2 gap-3">
            {metricas.map((m, i) => (
              <div
                key={i}
                className="border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5"
              >
                <p className="text-sm font-medium text-ink">
                  {m.nome}: {m.valor}
                  {m.unidade ? ` ${m.unidade}` : ""}
                </p>
                {m.descricao && (
                  <p className="text-xs text-texto-3 mt-0.5">{m.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* Metadados da análise */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-texto-3">
        <span className="inline-block rounded-full px-2.5 py-0.5 bg-[#E8E6DC]">
          {CONFIANCA[metadata.confianca] ?? metadata.confianca}
        </span>
        {metadata.campos_nao_encontrados.length > 0 && (
          <span>
            Não encontrado: {metadata.campos_nao_encontrados.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
