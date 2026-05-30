"use client";

import { useFormState } from "react-dom";
import {
  Campo,
  CampoSelect,
  BotaoEnviar,
  Aviso,
} from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import {
  SEGMENTOS,
  ROTULO_SEGMENTO,
  TAMANHOS,
  ROTULO_TAMANHO,
} from "@/lib/workspace/schema";
import { salvarConfiguracoesAction } from "@/app/(dashboard)/configuracoes/actions";
import type { Workspace } from "@/lib/workspace/db";

export function ConfiguracoesForm({ workspace }: { workspace: Workspace }) {
  const [estado, action] = useFormState(
    salvarConfiguracoesAction,
    ESTADO_INICIAL,
  );

  return (
    <form action={action} className="space-y-6">
      {/* Dados da empresa */}
      <div className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-ink">
          Dados da empresa
        </h2>
        <Campo label="Nome da empresa *" name="nome" defaultValue={workspace.nome} required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="CNPJ" name="cnpj" defaultValue={workspace.cnpj ?? ""} />
          <CampoSelect
            label="Segmento"
            name="segmento"
            defaultValue={workspace.segmento ?? ""}
            opcoes={SEGMENTOS.map((s) => ({
              valor: s,
              rotulo: ROTULO_SEGMENTO[s],
            }))}
          />
        </div>
        <CampoSelect
          label="Porte da empresa"
          name="tamanho"
          defaultValue={workspace.tamanho ?? ""}
          opcoes={TAMANHOS.map((t) => ({ valor: t, rotulo: ROTULO_TAMANHO[t] }))}
        />
      </div>

      {/* Marca (whitelabel) */}
      <div className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg text-ink">
            Marca nos relatórios
          </h2>
          <p className="text-sm text-texto-2 mt-1">
            Personalize como sua empresa aparece nos relatórios.
          </p>
        </div>

        {/* Logo */}
        <label className="block">
          <span className="block text-sm font-medium text-texto-2 mb-1.5">
            Logotipo (PNG, JPG, WEBP ou SVG — até 2 MB)
          </span>
          {workspace.whitelabel_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/whitelabel/${workspace.id}?v=${Date.now()}`}
              alt="Logo atual"
              className="h-12 w-auto mb-3 rounded border border-[color:var(--border-subtle)] bg-white p-1"
            />
          )}
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="w-full bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none file:mr-3 file:rounded file:border-0 file:bg-ink file:text-paper file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </label>

        <Campo
          label="Nome exibido nos relatórios"
          name="whitelabel_empresa_nome"
          defaultValue={workspace.whitelabel_empresa_nome ?? ""}
          placeholder={workspace.nome}
        />
        <label className="block">
          <span className="block text-sm font-medium text-texto-2 mb-1.5">
            Cor principal
          </span>
          <input
            type="color"
            name="whitelabel_cor_primaria"
            defaultValue={workspace.whitelabel_cor_primaria ?? "#0A0A0A"}
            className="h-10 w-20 rounded-md border border-[color:var(--border-default)] bg-paper cursor-pointer"
          />
        </label>
      </div>

      <Aviso erro={estado.erro} sucesso={estado.sucesso} />

      <div className="max-w-xs">
        <BotaoEnviar>Salvar alterações</BotaoEnviar>
      </div>
    </form>
  );
}
