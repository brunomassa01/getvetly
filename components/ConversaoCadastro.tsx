"use client";

import { useEffect } from "react";

// Dispara a conversão "Inscrição" do Google Ads UMA vez, quando um cadastro
// NOVO cai no painel (via ?cadastro=ok). Não dispara em logins normais —
// por isso fica preso a esse parâmetro, e não no painel inteiro.
const SEND_TO = "AW-18253685901/i8yWCLWojcIcEI3JhIBE";

type Gtag = (...args: unknown[]) => void;

export function ConversaoCadastro() {
  useEffect(() => {
    const w = window as unknown as { gtag?: Gtag };
    if (typeof w.gtag === "function") {
      w.gtag("event", "conversion", { send_to: SEND_TO });
    }
    // Remove o ?cadastro=ok da URL pra um refresh não tentar disparar de novo.
    const url = new URL(window.location.href);
    if (url.searchParams.has("cadastro")) {
      url.searchParams.delete("cadastro");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  return null;
}
