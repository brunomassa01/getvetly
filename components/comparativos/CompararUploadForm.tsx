"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { CampoArea, Aviso } from "@/components/auth/Campos";
import { OverlayAnalisando } from "@/components/propostas/OverlayAnalisando";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { compararNovosArquivosAction } from "@/app/(dashboard)/comparativos/actions";

const ACEITA = ".pdf,.docx,.xlsx,.xls,.csv,.ppt,.pptx,.png,.jpg,.jpeg";

export function CompararUploadForm() {
  const [estado, action] = useFormState(
    compararNovosArquivosAction,
    ESTADO_INICIAL,
  );
  const [comparando, setComparando] = useState(false);
  const [nomes, setNomes] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.erro) setComparando(false);
  }, [estado]);

  function atualizar(files: FileList | null) {
    setNomes(Array.from(files ?? []).map((f) => f.name));
  }

  function aoSoltar(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files?.length && inputRef.current) {
      inputRef.current.files = e.dataTransfer.files;
      atualizar(e.dataTransfer.files);
    }
  }

  return (
    <form action={action} className="space-y-5">
      <OverlayAnalisando ativo={comparando} titulo="Analisando e comparando..." />

      <input
        ref={inputRef}
        type="file"
        name="arquivos"
        multiple
        accept={ACEITA}
        className="sr-only"
        onChange={(e) => atualizar(e.target.files)}
      />

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
          {arrastando ? "Solte os arquivos aqui" : "Suba as propostas"}
        </p>
        <p className="text-sm text-texto-2 mt-1">
          Um arquivo por fornecedor (PDF, Excel, Word ou PPT). A IA analisa cada
          uma e monta a comparação.
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

      <CampoArea
        label="O que mais importa nesta decisão?"
        name="criterios"
        placeholder="Ex.: menor preço com bom alcance; prazo de pagamento mais longo; menor risco"
      />

      <Aviso erro={estado.erro} />

      <div className="flex gap-3 pt-1">
        <Link
          href="/comparativos"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          onClick={() => setComparando(true)}
          className="flex-[2] font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md hover:bg-lime-deep transition-colors"
        >
          Analisar e comparar
        </button>
      </div>
    </form>
  );
}
