"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import {
  Campo,
  CampoSelect,
  CampoArea,
  BotaoEnviar,
  Aviso,
} from "@/components/auth/Campos";
import { ESTADO_INICIAL, type EstadoForm } from "@/lib/auth/tipos";
import { CATEGORIAS, ROTULO_CATEGORIA } from "@/lib/fornecedores/schema";
import type { Fornecedor } from "@/lib/fornecedores/db";

type Acao = (prev: EstadoForm, formData: FormData) => Promise<EstadoForm>;

export function FornecedorForm({
  action,
  fornecedor,
}: {
  action: Acao;
  fornecedor?: Fornecedor;
}) {
  const [estado, formAction] = useFormState(action, ESTADO_INICIAL);
  const opcoes = CATEGORIAS.map((c) => ({
    valor: c,
    rotulo: ROTULO_CATEGORIA[c],
  }));

  return (
    <form action={formAction} className="space-y-4">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}

      <Campo
        label="Nome *"
        name="nome"
        defaultValue={fornecedor?.nome ?? ""}
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo label="CNPJ" name="cnpj" defaultValue={fornecedor?.cnpj ?? ""} />
        <CampoSelect
          label="Categoria"
          name="segmento"
          opcoes={opcoes}
          defaultValue={fornecedor?.segmento ?? ""}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo
          label="E-mail"
          name="email"
          type="email"
          defaultValue={fornecedor?.email ?? ""}
        />
        <Campo
          label="Telefone"
          name="telefone"
          defaultValue={fornecedor?.telefone ?? ""}
        />
      </div>

      <CampoArea
        label="Observações"
        name="observacoes"
        defaultValue={fornecedor?.observacoes ?? ""}
      />

      <Aviso erro={estado?.erro} />

      <div className="flex gap-3 pt-2">
        <Link
          href="/fornecedores"
          className="flex-1 text-center font-body font-semibold text-sm bg-transparent text-ink px-5 py-2.5 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
        >
          Cancelar
        </Link>
        <div className="flex-1">
          <BotaoEnviar>{fornecedor ? "Salvar" : "Cadastrar"}</BotaoEnviar>
        </div>
      </div>
    </form>
  );
}
