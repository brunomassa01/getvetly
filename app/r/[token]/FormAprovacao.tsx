"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registrarAprovacaoAction } from "./actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { DECISOES, ROTULO_DECISAO } from "@/lib/compartilhamentos/schema";

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors disabled:opacity-90 disabled:cursor-wait"
    >
      {pending && (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-spin"
          aria-hidden
        />
      )}
      {pending ? "Enviando…" : "Enviar decisão"}
    </button>
  );
}

/**
 * Formulário de aprovação exibido na página pública /r/[token].
 *
 * Para um comparativo (concorrência), o aprovador escolhe qual proposta
 * aprovar — vem com a recomendada pelo comprador já marcada, mas ele pode
 * trocar. Quem decide é quem aprova.
 */
export function FormAprovacao({
  token,
  opcoes = [],
  recomendadaId = null,
}: {
  token: string;
  opcoes?: { id: string; titulo: string }[];
  recomendadaId?: string | null;
}) {
  const [estado, action] = useFormState(registrarAprovacaoAction, ESTADO_INICIAL);

  if (estado?.sucesso) {
    return (
      <div className="bg-lime-faint border border-lime-deep/30 rounded-lg p-5 text-center">
        <p className="font-display font-bold text-ink">{estado?.sucesso}</p>
        <p className="text-sm text-texto-2 mt-1">
          Você pode fechar esta página.
        </p>
      </div>
    );
  }

  const ehConcorrencia = opcoes.length > 0;
  // Pré-seleção: a recomendada pelo comprador (ou a primeira, se não houver).
  const recomendadaValida =
    recomendadaId && opcoes.some((o) => o.id === recomendadaId)
      ? recomendadaId
      : opcoes[0]?.id ?? null;

  return (
    <form
      action={action}
      className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-6 space-y-5"
    >
      <input type="hidden" name="token" value={token} />

      {/* Concorrência: escolher qual proposta aprovar (recomendada pré-marcada) */}
      {ehConcorrencia && (
        <fieldset className="space-y-2">
          <legend className="font-display font-bold text-lg text-ink">
            Qual proposta você aprova?
          </legend>
          <p className="text-sm text-texto-3 mb-1">
            A recomendada pelo comprador já vem marcada — você pode manter ou
            escolher outra.
          </p>
          {opcoes.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-3 border border-[color:var(--border-subtle)] rounded-md px-4 py-3 cursor-pointer hover:bg-paper-warm transition-colors"
            >
              <input
                type="radio"
                name="proposta_aprovada_id"
                value={o.id}
                defaultChecked={o.id === recomendadaValida}
                className="accent-lime-deep"
              />
              <span className="text-sm text-ink font-medium">{o.titulo}</span>
              {o.id === recomendadaValida && (
                <span className="ml-auto text-[11px] font-mono uppercase tracking-wide2 text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-2 py-0.5">
                  Recomendada
                </span>
              )}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="font-display font-bold text-lg text-ink">
          Sua decisão
        </legend>
        <p className="text-sm text-texto-3 mb-1">
          {ehConcorrencia
            ? "Aprovar fecha a concorrência: a escolhida acima vira aprovada e as demais, recusadas."
            : "Avalie a proposta acima e registre seu parecer."}
        </p>
        {DECISOES.map((d) => (
          <label
            key={d}
            className="flex items-center gap-3 border border-[color:var(--border-subtle)] rounded-md px-4 py-3 cursor-pointer hover:bg-paper-warm transition-colors"
          >
            <input
              type="radio"
              name="decisao"
              value={d}
              required
              className="accent-lime-deep"
            />
            <span className="text-sm text-ink font-medium">
              {ROTULO_DECISAO[d]}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Seu nome <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="revisor_nome"
            required
            minLength={2}
            placeholder="Ex: Maria Souza"
            className="w-full text-sm border border-[color:var(--border-subtle)] rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Seu e-mail <span className="text-texto-3 font-normal">(opcional)</span>
          </label>
          <input
            type="email"
            name="revisor_email"
            placeholder="voce@empresa.com"
            className="w-full text-sm border border-[color:var(--border-subtle)] rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          Comentário <span className="text-texto-3 font-normal">(opcional)</span>
        </label>
        <textarea
          name="justificativa"
          rows={3}
          placeholder="Observações, ressalvas ou condições para aprovar…"
          className="w-full text-sm border border-[color:var(--border-subtle)] rounded-md px-3 py-2"
        />
      </div>

      {estado?.erro && <p className="text-sm text-danger">{estado?.erro}</p>}

      <BotaoEnviar />
    </form>
  );
}
