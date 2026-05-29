"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Campo, Aviso } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { criarEAnalisarPropostaAction } from "@/app/(dashboard)/propostas/actions";
import { OverlayAnalisando } from "./OverlayAnalisando";

function BotaoAnalisar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md transition-colors hover:bg-lime-deep disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending
        ? "Analisando proposta... (pode levar até 1 min)"
        : "Analisar proposta"}
    </button>
  );
}

export function PropostaForm() {
  const [estado, action] = useFormState(
    criarEAnalisarPropostaAction,
    ESTADO_INICIAL,
  );
  const [nomes, setNomes] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function atualizarNomes(files: FileList | null) {
    setNomes(Array.from(files ?? []).map((f) => f.name));
  }

  function aoSoltar(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    const files = e.dataTransfer.files;
    if (files?.length && inputRef.current) {
      inputRef.current.files = files;
      atualizarNomes(files);
    }
  }

  return (
    <form action={action} className="space-y-5">
      <OverlayAnalisando />
      {/* Input real (escondido), preenchido por clique ou drag-and-drop */}
      <input
        ref={inputRef}
        type="file"
        name="arquivos"
        multiple
        accept=".pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
        className="sr-only"
        onChange={(e) => atualizarNomes(e.target.files)}
      />

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-12 text-center transition-colors ${
          arrastando
            ? "border-lime-deep bg-lime-faint"
            : "border-[color:var(--border-default)] bg-white hover:border-lime-deep"
        }`}
      >
        <p className="font-display font-bold text-lg text-ink">
          {arrastando ? "Solte o arquivo aqui" : "Suba a proposta"}
        </p>
        <p className="text-sm text-texto-2 mt-1">
          Arraste o arquivo aqui ou clique para escolher (PDF com texto). A IA
          cuida do resto: fornecedor, valores, categoria e leitura crítica.
        </p>
        {nomes.length > 0 && (
          <ul className="mt-4 inline-block text-left space-y-1">
            {nomes.map((n) => (
              <li key={n} className="text-sm text-ink">
                📄 {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Campo
        label="Título (opcional — usamos o nome do arquivo se vazio)"
        name="titulo"
        placeholder="Ex.: Campanha CLT - Eletromidia"
      />

      <Aviso erro={estado.erro} />

      <div className="flex gap-3 pt-1">
        <Link
          href="/propostas"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <div className="flex-[2]">
          <BotaoAnalisar />
        </div>
      </div>
    </form>
  );
}
