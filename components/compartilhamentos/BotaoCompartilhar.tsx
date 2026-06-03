"use client";

import { useState, useTransition } from "react";
import { criarLinkCompartilhamentoAction } from "@/app/(dashboard)/compartilhar/actions";
import type { TipoAlvo } from "@/lib/compartilhamentos/schema";
import { FormEnviarEmail } from "./FormEnviarEmail";

/**
 * Gera um link público de aprovação e mostra a URL com um botão de copiar.
 * O link é criado sob demanda (só quando o usuário clica), reaproveitando
 * um link ativo se já existir para o mesmo conteúdo.
 *
 * Para comparativos (concorrência), o usuário escolhe ANTES qual proposta ele
 * recomenda. Se o aprovador aprovar o link, essa proposta vira "aprovada".
 */
export function BotaoCompartilhar({
  tipo,
  refId,
  titulo,
  propostas = [],
  recomendadaInicial = null,
}: {
  tipo: TipoAlvo;
  refId: string;
  titulo: string;
  propostas?: { id: string; titulo: string }[];
  recomendadaInicial?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recomendada, setRecomendada] = useState<string>(
    recomendadaInicial ?? "",
  );

  const ehComparativo = tipo === "comparativo";

  function gerar() {
    setErro(null);
    if (ehComparativo && !recomendada) {
      setErro("Escolha qual proposta você recomenda antes de gerar o link.");
      return;
    }
    startTransition(async () => {
      const r = await criarLinkCompartilhamentoAction(
        tipo,
        refId,
        ehComparativo ? recomendada : undefined,
      );
      if (r.ok) setUrl(`${window.location.origin}${r.path}`);
      else setErro(r.erro);
    });
  }

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navegador sem permissão de clipboard: usuário copia do campo manualmente
    }
  }

  return (
    <section className="print:hidden bg-white border border-[color:var(--border-subtle)] rounded-lg p-5">
      <h2 className="font-display font-bold text-lg text-ink">
        Compartilhar para aprovação
      </h2>
      <p className="text-sm text-texto-3 mt-1">
        Gere um link para enviar à diretoria. Quem abrir vê o relatório e pode
        aprovar ou recusar — sem precisar de conta. O link vale por 15 dias.
      </p>

      {/* Comparativo: escolher a proposta recomendada antes de compartilhar */}
      {ehComparativo && (
        <div className="mt-4">
          <label className="block text-sm text-ink font-medium mb-1">
            Qual proposta você recomenda? <span className="text-danger">*</span>
          </label>
          <select
            value={recomendada}
            onChange={(e) => setRecomendada(e.target.value)}
            className="w-full sm:w-auto text-sm bg-paper border border-[color:var(--border-default)] rounded-md px-3 py-2 text-ink outline-none focus:border-lime-deep focus:shadow-ring"
          >
            <option value="">Selecione a proposta…</option>
            {propostas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
          <p className="text-xs text-texto-3 mt-1">
            Se o aprovador aprovar, esta vira <strong>Aprovada</strong> e as
            demais desta concorrência viram <strong>Recusada</strong>.
          </p>
        </div>
      )}

      {!url ? (
        <button
          type="button"
          onClick={gerar}
          disabled={pending}
          className="mt-4 inline-flex items-center gap-2 font-body font-semibold text-sm bg-lime text-ink px-4 py-2.5 rounded-md hover:bg-lime-deep transition-colors disabled:opacity-90 disabled:cursor-wait"
        >
          {pending && (
            <span
              className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-spin"
              aria-hidden
            />
          )}
          {pending ? "Gerando link…" : "Gerar link de aprovação"}
        </button>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 text-sm bg-paper-warm border border-[color:var(--border-subtle)] rounded-md px-3 py-2 text-texto-2 font-mono"
          />
          <button
            type="button"
            onClick={copiar}
            className="shrink-0 font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            {copiado ? "Copiado ✓" : "Copiar link"}
          </button>
        </div>
      )}

      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

      <div className="mt-5 pt-5 border-t border-[color:var(--border-subtle)]">
        <p className="text-sm text-ink font-medium mb-2">
          Ou envie direto por e-mail
        </p>
        <FormEnviarEmail
          tipo={tipo}
          refId={refId}
          titulo={titulo}
          propostaRecomendadaId={ehComparativo ? recomendada : undefined}
        />
      </div>
    </section>
  );
}
