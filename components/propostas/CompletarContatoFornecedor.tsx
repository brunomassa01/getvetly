"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { completarContatoFornecedorAction } from "@/app/(dashboard)/propostas/actions";

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-body font-semibold text-sm bg-ink text-paper px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar contato"}
    </button>
  );
}

/**
 * Card opcional para completar os dados de contato do fornecedor quando a IA
 * não os encontrou. Só aparece quando algum dado básico está faltando.
 */
export function CompletarContatoFornecedor({
  propostaId,
  fornecedorId,
  fornecedorNome,
  cnpj,
  email,
  telefone,
}: {
  propostaId: string;
  fornecedorId: string;
  fornecedorNome: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
}) {
  const [fechado, setFechado] = useState(false);
  if (fechado) return null;

  return (
    <form
      action={completarContatoFornecedorAction}
      className="print:hidden rounded-xl border border-[color:var(--border-default)] bg-paper-warm p-5"
    >
      <input type="hidden" name="propostaId" value={propostaId} />
      <input type="hidden" name="fornecedorId" value={fornecedorId} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-ink">
            Complete o contato do fornecedor
          </h3>
          <p className="text-sm text-texto-2 mt-0.5">
            A IA não encontrou todos os dados de{" "}
            <span className="font-medium">{fornecedorNome ?? "fornecedor"}</span>.
            Preencha o que tiver — é opcional e ajuda nos próximos relatórios.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFechado(true)}
          className="text-texto-3 hover:text-ink text-sm shrink-0"
          aria-label="Fechar"
        >
          Agora não
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <label className="block">
          <span className="text-xs text-texto-3">CNPJ</span>
          <input
            name="cnpj"
            defaultValue={cnpj ?? ""}
            placeholder="00.000.000/0001-00"
            className="mt-1 w-full rounded-md border border-[color:var(--border-default)] bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs text-texto-3">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="contato@fornecedor.com"
            className="mt-1 w-full rounded-md border border-[color:var(--border-default)] bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs text-texto-3">Telefone</span>
          <input
            name="telefone"
            defaultValue={telefone ?? ""}
            placeholder="(11) 99999-0000"
            className="mt-1 w-full rounded-md border border-[color:var(--border-default)] bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>

      <div className="mt-4">
        <BotaoSalvar />
      </div>
    </form>
  );
}
