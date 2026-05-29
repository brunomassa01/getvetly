"use client";

import { useFormStatus } from "react-dom";
import { analisarPropostaAction } from "@/app/(dashboard)/propostas/actions";
import { OverlayAnalisando } from "./OverlayAnalisando";

function BotaoEOverlay({ rotular }: { rotular: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md transition-colors hover:bg-lime-deep disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Analisando..." : rotular}
      </button>
      <OverlayAnalisando ativo={pending} />
    </>
  );
}

export function BotaoAnalisar({
  propostaId,
  rotular,
}: {
  propostaId: string;
  rotular: string;
}) {
  return (
    <form action={analisarPropostaAction}>
      <input type="hidden" name="id" value={propostaId} />
      <BotaoEOverlay rotular={rotular} />
    </form>
  );
}
