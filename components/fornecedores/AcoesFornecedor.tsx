"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  arquivarFornecedorAction,
  excluirFornecedorAction,
  salvarObservacoesFornecedorAction,
} from "@/app/(dashboard)/fornecedores/actions";

export function AcoesFornecedor({
  id,
  nome,
  observacoes,
}: {
  id: string;
  nome: string;
  observacoes: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [modalObs, setModalObs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora.
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

  const itemClasse =
    "block w-full text-left px-4 py-2 text-sm text-ink hover:bg-paper-warm transition-colors";

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Ações"
        className="px-2 py-1 rounded-md text-texto-2 hover:bg-paper-warm text-lg leading-none"
      >
        ⋯
      </button>

      {aberto && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-[color:var(--border-subtle)] bg-white shadow-lg py-1">
          <Link href={`/fornecedores/${id}`} className={itemClasse}>
            Editar
          </Link>
          <button
            type="button"
            className={itemClasse}
            onClick={() => {
              setModalObs(true);
              setAberto(false);
            }}
          >
            Observações
          </button>
          <form
            action={arquivarFornecedorAction}
            onSubmit={(e) => {
              if (!confirm(`Arquivar "${nome}"? Ele some da lista mas pode voltar.`))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={itemClasse}>
              Arquivar
            </button>
          </form>
          <form
            action={excluirFornecedorAction}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Excluir "${nome}" PERMANENTEMENTE? As propostas ficam, mas sem fornecedor vinculado. Não dá pra desfazer.`,
                )
              )
                e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={`${itemClasse} text-danger`}>
              Excluir
            </button>
          </form>
        </div>
      )}

      {modalObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            action={salvarObservacoesFornecedorAction}
            onSubmit={() => setModalObs(false)}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <input type="hidden" name="id" value={id} />
            <h3 className="font-display font-bold text-ink text-lg">
              Observações — {nome}
            </h3>
            <p className="text-sm text-texto-2 mt-0.5 mb-3">
              Anotações internas sobre este fornecedor.
            </p>
            <textarea
              name="observacoes"
              defaultValue={observacoes ?? ""}
              rows={5}
              placeholder="Ex.: bom atendimento, costuma atrasar entrega, contato direto pelo WhatsApp…"
              className="w-full rounded-md border border-[color:var(--border-default)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-lime-deep"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setModalObs(false)}
                className="font-body font-semibold text-sm bg-transparent text-ink px-4 py-2 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
