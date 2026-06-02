"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Campo, Aviso } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { criarEAnalisarPropostaAction } from "@/app/(dashboard)/propostas/actions";
import { OverlayAnalisando } from "./OverlayAnalisando";

const ACEITA = ".pdf,.docx,.xlsx,.xls,.csv,.ppt,.pptx,.png,.jpg,.jpeg";
const TAMANHO_MAX = 25 * 1024 * 1024; // 25 MB no total (limite do servidor)

export function PropostaForm() {
  const [estado, action] = useFormState(
    criarEAnalisarPropostaAction,
    ESTADO_INICIAL,
  );
  const [analisando, setAnalisando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [nomes, setNomes] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Se a ação voltar com erro, esconde o overlay (em sucesso, navega e desmonta).
  // estado pode vir indefinido se o envio falhar no servidor — por isso o "?.".
  useEffect(() => {
    if (estado?.erro) setAnalisando(false);
  }, [estado]);

  // Valida no cliente antes de enviar: evita o 413 do servidor e dá mensagem clara.
  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    setErroLocal(null);
    const arquivos = Array.from(inputRef.current?.files ?? []);
    if (arquivos.length === 0) {
      e.preventDefault();
      setErroLocal("Anexe ao menos um arquivo.");
      return;
    }
    const total = arquivos.reduce((soma, f) => soma + f.size, 0);
    if (total > TAMANHO_MAX) {
      e.preventDefault();
      setErroLocal(
        "Arquivo(s) muito grande(s): o total passa de 25 MB. Comprima o PDF ou envie só o essencial.",
      );
      return;
    }
    setAnalisando(true);
  }

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
    <form action={action} onSubmit={aoEnviar} className="space-y-5">
      <OverlayAnalisando ativo={analisando} />

      <input
        ref={inputRef}
        type="file"
        name="arquivos"
        multiple
        accept={ACEITA}
        className="sr-only"
        onChange={(e) => atualizarNomes(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        data-tour="dropzone-upload"
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
          {arrastando ? "Solte os arquivos aqui" : "Suba a proposta"}
        </p>
        <p className="text-sm text-texto-2 mt-1">
          Arraste os arquivos ou clique para escolher. Pode ser mais de um da
          mesma proposta: PDF, Excel, Word ou PowerPoint. A IA lê tudo junto.
        </p>
        <p className="text-xs text-texto-3 mt-2">
          Até 25 MB no total por proposta.
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

      <Aviso erro={erroLocal ?? estado?.erro} />

      <div className="flex gap-3 pt-1">
        <Link
          href="/propostas"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-3 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          data-tour="btn-analisar"
          className="flex-[2] font-body font-semibold text-sm bg-lime text-ink px-5 py-3 rounded-md hover:bg-lime-deep transition-colors"
        >
          Analisar proposta
        </button>
      </div>
    </form>
  );
}
