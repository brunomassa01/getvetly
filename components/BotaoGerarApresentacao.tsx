"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Navega para a tela de apresentação mostrando "Gerando…" enquanto a IA monta
 * o roteiro no servidor (o `useTransition` segue pendente até a página abrir).
 */
export function BotaoGerarApresentacao({ href }: { href: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.push(href))}
      className="inline-flex items-center gap-2 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors disabled:opacity-90 disabled:cursor-wait"
    >
      {pending && (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-spin"
          aria-hidden
        />
      )}
      {pending ? "Gerando apresentação…" : "Gerar apresentação"}
    </button>
  );
}
