"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sairAction } from "@/app/(auth)/actions";

const ITENS = [
  { href: "/conta", rotulo: "Conta" },
  { href: "/financeiro", rotulo: "Financeiro" },
  { href: "/usuarios", rotulo: "Gestão de Usuários" },
  { href: "/configuracoes", rotulo: "Configurações da Empresa" },
  { href: "/ajuda", rotulo: "Ajuda" },
];

export function MenuPerfil({
  nome,
  email,
  temAvatar = false,
}: {
  nome: string | null;
  email: string | null;
  temAvatar?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const rotuloUsuario = nome || email || "Conta";
  const inicial = (nome || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Menu da conta"
        className="flex items-center justify-center w-9 h-9 rounded-full bg-ink text-paper font-display font-bold text-sm hover:opacity-90 transition-opacity overflow-hidden"
      >
        {temAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/api/avatar" alt="" className="w-full h-full object-cover" />
        ) : (
          inicial
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-[color:var(--border-subtle)] bg-white shadow-lg py-1">
          <div className="px-4 py-3 border-b border-[color:var(--border-subtle)]">
            <p className="text-sm font-medium text-ink truncate">
              {rotuloUsuario}
            </p>
            {email && nome && (
              <p className="text-xs text-texto-3 truncate">{email}</p>
            )}
          </div>
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper-warm transition-colors"
            >
              {item.rotulo}
            </Link>
          ))}
          <div className="border-t border-[color:var(--border-subtle)] mt-1 pt-1">
            <form action={sairAction}>
              <button
                type="submit"
                className="block w-full text-left px-4 py-2 text-sm text-texto-2 hover:bg-paper-warm hover:text-ink transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
