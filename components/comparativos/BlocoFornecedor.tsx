"use client";

import { useEffect, useRef, useState } from "react";

const ACEITA = ".pdf,.docx,.xlsx,.xls,.csv,.ppt,.pptx,.png,.jpg,.jpeg";

function chaveArquivo(f: File): string {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

/**
 * Um fornecedor dentro do "Subir e comparar": nome opcional + vários arquivos
 * (acumulam, inclusive de pastas diferentes). Os campos vão no formulário com
 * o id do bloco no nome (`nome_<id>`, `arquivos_<id>`), pra a ação agrupar.
 */
export function BlocoFornecedor({
  id,
  numero,
  podeRemover,
  onRemover,
}: {
  id: string;
  numero: number;
  podeRemover: boolean;
  onRemover: () => void;
}) {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mantém o <input> em sincronia com a lista (pra o form enviar todos).
  useEffect(() => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    arquivos.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }, [arquivos]);

  function adicionar(novos: FileList | null) {
    const lista = Array.from(novos ?? []);
    if (lista.length === 0) return;
    setArquivos((atual) => {
      const vistos = new Set(atual.map(chaveArquivo));
      return [...atual, ...lista.filter((f) => !vistos.has(chaveArquivo(f)))];
    });
  }

  function remover(chave: string) {
    setArquivos((atual) => atual.filter((f) => chaveArquivo(f) !== chave));
  }

  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-wide2 uppercase text-texto-2 bg-[#E8E6DC] rounded-full px-2.5 py-1">
          Fornecedor {numero}
        </span>
        {podeRemover && (
          <button
            type="button"
            onClick={onRemover}
            className="text-xs text-texto-3 hover:text-danger transition-colors"
          >
            Remover fornecedor
          </button>
        )}
      </div>

      <input
        type="text"
        name={`nome_${id}`}
        placeholder="Nome do fornecedor (opcional)"
        className="w-full mb-3 bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3"
      />

      <input
        ref={inputRef}
        type="file"
        name={`arquivos_${id}`}
        multiple
        accept={ACEITA}
        className="sr-only"
        onChange={(e) => {
          adicionar(e.target.files);
          e.target.value = "";
        }}
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
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          adicionar(e.dataTransfer.files);
        }}
        className={`cursor-pointer border-2 border-dashed rounded-lg px-4 py-6 text-center transition-colors ${
          arrastando
            ? "border-lime-deep bg-lime-faint"
            : "border-[color:var(--border-default)] hover:border-lime-deep"
        }`}
      >
        <p className="text-sm text-texto-2">
          {arrastando
            ? "Solte os arquivos aqui"
            : "Arraste ou clique — pode somar vários arquivos (de pastas diferentes)"}
        </p>
        {arquivos.length > 0 && (
          <ul className="mt-3 inline-block text-left space-y-1">
            {arquivos.map((f) => {
              const chave = chaveArquivo(f);
              return (
                <li
                  key={chave}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <span className="truncate max-w-[240px]">📄 {f.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remover(chave);
                    }}
                    aria-label={`Remover ${f.name}`}
                    className="text-texto-3 hover:text-danger transition-colors"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
