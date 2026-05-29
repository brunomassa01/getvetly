"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import {
  Campo,
  CampoSelect,
  BotaoEnviar,
  Aviso,
} from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { CATEGORIAS, ROTULO_CATEGORIA } from "@/lib/fornecedores/schema";
import { criarPropostaAction } from "@/app/(dashboard)/propostas/actions";

const baseInput =
  "w-full bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring file:mr-3 file:rounded file:border-0 file:bg-ink file:text-paper file:px-3 file:py-1.5 file:text-xs file:font-medium";

export function PropostaForm({
  fornecedores,
}: {
  fornecedores: { id: string; nome: string }[];
}) {
  const [estado, action] = useFormState(criarPropostaAction, ESTADO_INICIAL);
  const opcoesCategoria = CATEGORIAS.map((c) => ({
    valor: c,
    rotulo: ROTULO_CATEGORIA[c],
  }));

  return (
    <form action={action} className="space-y-4">
      <Campo
        label="Título da proposta *"
        name="titulo"
        placeholder="Ex.: Campanha CLT - Eletromidia"
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <CampoSelect
          label="Fornecedor"
          name="fornecedor_id"
          placeholder="Selecione (opcional)"
          opcoes={fornecedores.map((f) => ({ valor: f.id, rotulo: f.nome }))}
        />
        <CampoSelect
          label="Categoria *"
          name="categoria"
          opcoes={opcoesCategoria}
        />
      </div>

      <Campo
        label="Escopo"
        name="escopo"
        placeholder="Ex.: São Paulo, 28 dias"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo
          label="Valor de tabela (R$)"
          name="valor_tabela"
          inputMode="decimal"
          placeholder="0,00"
        />
        <Campo
          label="Valor negociado (R$)"
          name="valor_negociado"
          inputMode="decimal"
          placeholder="0,00"
        />
      </div>

      <Campo
        label="E-mail do aprovador"
        name="aprovador_email"
        type="email"
        placeholder="diretor@empresa.com"
      />

      <label className="block">
        <span className="block text-sm font-medium text-texto-2 mb-1.5">
          Arquivos da proposta
        </span>
        <input
          type="file"
          name="arquivos"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
          className={baseInput}
        />
        <span className="block text-xs text-texto-3 mt-1.5">
          PDF, DOCX, XLSX, CSV ou imagens. A análise por IA chega na próxima etapa.
        </span>
      </label>

      <Aviso erro={estado.erro} />

      <div className="flex gap-3 pt-2">
        <Link
          href="/propostas"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <div className="flex-1">
          <BotaoEnviar>Criar proposta</BotaoEnviar>
        </div>
      </div>
    </form>
  );
}
