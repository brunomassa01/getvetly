"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enviarLinkPorEmailAction } from "@/app/(dashboard)/compartilhar/actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import type { TipoAlvo } from "@/lib/compartilhamentos/schema";

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 inline-flex items-center gap-2 font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
    >
      {pending && (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-paper/40 border-t-paper animate-spin"
          aria-hidden
        />
      )}
      {pending ? "Enviando…" : "Enviar por e-mail"}
    </button>
  );
}

/** Envia o link de aprovação direto por e-mail para o destinatário. */
export function FormEnviarEmail({
  tipo,
  refId,
  titulo,
  propostaRecomendadaId,
}: {
  tipo: TipoAlvo;
  refId: string;
  titulo: string;
  propostaRecomendadaId?: string;
}) {
  const [estado, action] = useFormState(enviarLinkPorEmailAction, ESTADO_INICIAL);

  return (
    <form action={action}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="refId" value={refId} />
      <input type="hidden" name="titulo" value={titulo} />
      <input
        type="hidden"
        name="propostaRecomendadaId"
        value={propostaRecomendadaId ?? ""}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          name="destinatario"
          required
          placeholder="e-mail de quem vai aprovar"
          className="flex-1 text-sm border border-[color:var(--border-subtle)] rounded-md px-3 py-2"
        />
        <BotaoEnviar />
      </div>
      <textarea
        name="mensagem"
        rows={2}
        placeholder="Mensagem para acompanhar (opcional)"
        className="mt-2 w-full text-sm border border-[color:var(--border-subtle)] rounded-md px-3 py-2"
      />

      {estado?.erro && <p className="mt-2 text-sm text-danger">{estado?.erro}</p>}
      {estado?.sucesso && (
        <p className="mt-2 text-sm font-medium text-[#5C7A0E]">{estado?.sucesso}</p>
      )}
    </form>
  );
}
