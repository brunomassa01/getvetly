"use client";

import { marcarConvidadoAction } from "./actions";

/**
 * Abre o WhatsApp (link wa.me) numa nova aba com a mensagem pronta e, ao clicar,
 * registra que o lead foi convidado. O envio em si é manual: você confere a
 * mensagem e aperta enviar no seu WhatsApp.
 */
export function BotaoWhatsapp({ href, id }: { href: string; id: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void marcarConvidadoAction(id);
      }}
      className="text-sm font-medium text-[#5C7A0E] hover:underline"
    >
      WhatsApp
    </a>
  );
}
