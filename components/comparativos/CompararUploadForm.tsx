"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import { CampoArea, Aviso } from "@/components/auth/Campos";
import { OverlayAnalisando } from "@/components/propostas/OverlayAnalisando";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { compararNovosArquivosAction } from "@/app/(dashboard)/comparativos/actions";
import { BlocoFornecedor } from "./BlocoFornecedor";

const TAMANHO_MAX = 25 * 1024 * 1024; // 25 MB no total (limite do servidor)

export function CompararUploadForm() {
  const [estado, action] = useFormState(
    compararNovosArquivosAction,
    ESTADO_INICIAL,
  );
  const [comparando, setComparando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  // Começa com 2 fornecedores (mínimo de uma concorrência). Ids estáveis.
  const [blocos, setBlocos] = useState<{ id: string }[]>([
    { id: "f1" },
    { id: "f2" },
  ]);
  const proximoId = useRef(3);

  function adicionarFornecedor() {
    setBlocos((b) => [...b, { id: `f${proximoId.current++}` }]);
  }

  function removerFornecedor(id: string) {
    setBlocos((b) => (b.length <= 2 ? b : b.filter((x) => x.id !== id)));
  }

  // Valida lendo os próprios inputs do formulário (cada bloco é dono dos seus).
  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    setErroLocal(null);
    const form = e.currentTarget;
    let comArquivos = 0;
    let total = 0;
    for (const b of blocos) {
      const input = form.querySelector(
        `input[name="arquivos_${b.id}"]`,
      ) as HTMLInputElement | null;
      const files = input?.files;
      if (files && files.length > 0) {
        comArquivos += 1;
        total += Array.from(files).reduce((s, f) => s + f.size, 0);
      }
    }
    if (comArquivos < 2) {
      e.preventDefault();
      setErroLocal(
        "Adicione pelo menos 2 fornecedores, com ao menos um arquivo em cada.",
      );
      return;
    }
    if (total > TAMANHO_MAX) {
      e.preventDefault();
      setErroLocal(
        "Os arquivos somam mais de 25 MB. Comprima os PDFs ou envie só o essencial.",
      );
      return;
    }
    setComparando(true);
  }

  return (
    <form action={action} onSubmit={aoEnviar} className="space-y-5">
      <OverlayAnalisando ativo={comparando} titulo="Analisando e comparando..." />

      {/* Lista de ids dos fornecedores, pra a ação agrupar os arquivos. */}
      <input
        type="hidden"
        name="fornecedores"
        value={blocos.map((b) => b.id).join(",")}
      />

      <div className="space-y-4">
        {blocos.map((b, i) => (
          <BlocoFornecedor
            key={b.id}
            id={b.id}
            numero={i + 1}
            podeRemover={blocos.length > 2}
            onRemover={() => removerFornecedor(b.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={adicionarFornecedor}
        className="w-full border-2 border-dashed border-[color:var(--border-default)] rounded-lg py-3 text-sm font-medium text-texto-2 hover:border-lime-deep hover:text-ink transition-colors"
      >
        + Adicionar fornecedor
      </button>

      <CampoArea
        label="O que mais importa nesta decisão?"
        name="criterios"
        placeholder="Ex.: menor preço com bom alcance; prazo de pagamento mais longo; menor risco"
      />

      <Aviso erro={erroLocal ?? estado?.erro} />

      <div className="flex gap-3 pt-1">
        <Link
          href="/comparativos"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="flex-[2] font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md hover:bg-lime-deep transition-colors"
        >
          Analisar e comparar
        </button>
      </div>
    </form>
  );
}
