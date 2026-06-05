"use client";

import { useState, useTransition } from "react";
import { enviarConviteEmailAction } from "./actions";

/**
 * Envia o convite por e-mail e mostra o resultado na hora ("✓ enviado" ou o
 * erro), pra o usuário não ficar clicando sem saber se foi.
 */
export function BotaoEnviarEmail({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  function enviar() {
    setFeedback(null);
    iniciar(async () => {
      const r = await enviarConviteEmailAction(id);
      setFeedback({ ok: r.ok, msg: r.mensagem });
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={enviar}
        disabled={pendente}
        className="text-sm font-medium text-[#5C7A0E] hover:underline disabled:opacity-50"
      >
        {pendente ? "Enviando..." : "Enviar e-mail"}
      </button>
      {feedback && (
        <span
          className={`text-xs ${feedback.ok ? "text-[#5C7A0E]" : "text-danger"}`}
          title={feedback.msg}
        >
          {feedback.ok ? "✓ enviado" : `✗ ${feedback.msg}`}
        </span>
      )}
    </span>
  );
}
