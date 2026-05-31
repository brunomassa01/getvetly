"use client";

import { useFormState } from "react-dom";
import { Campo, Aviso, BotaoEnviar } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { atualizarPerfilAction } from "@/app/(dashboard)/conta/actions";

export function ContaForm({
  nome,
  email,
  telefone,
  temAvatar,
}: {
  nome: string | null;
  email: string;
  telefone: string | null;
  temAvatar: boolean;
}) {
  const [estado, action] = useFormState(atualizarPerfilAction, ESTADO_INICIAL);
  const inicial = (nome || email || "?").trim().charAt(0).toUpperCase();

  return (
    <form action={action} className="space-y-5 max-w-md">
      <div className="flex items-center gap-4">
        {temAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/api/avatar"
            alt="Sua foto"
            className="w-16 h-16 rounded-full object-cover border border-[color:var(--border-subtle)]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-display font-bold text-xl">
            {inicial}
          </div>
        )}
        <label className="block">
          <span className="block text-sm font-medium text-texto-2 mb-1.5">
            Foto (PNG, JPG ou WEBP — até 2 MB)
          </span>
          <input
            type="file"
            name="foto"
            accept="image/png,image/jpeg,image/webp"
            className="block text-sm text-texto-2 file:mr-3 file:rounded-md file:border file:border-[color:var(--border-strong)] file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
          />
        </label>
      </div>

      <Campo label="Nome" name="nome" defaultValue={nome ?? ""} placeholder="Seu nome" />
      <Campo
        label="Telefone"
        name="telefone"
        defaultValue={telefone ?? ""}
        placeholder="(11) 99999-0000"
      />

      <label className="block">
        <span className="block text-sm font-medium text-texto-2 mb-1.5">
          E-mail
        </span>
        <input
          defaultValue={email}
          disabled
          className="w-full bg-paper-warm border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5 text-sm text-texto-3"
        />
        <span className="block text-xs text-texto-3 mt-1">
          O e-mail é o seu login e não pode ser alterado por aqui.
        </span>
      </label>

      <Aviso erro={estado?.erro} sucesso={estado?.sucesso} />
      <BotaoEnviar>Salvar perfil</BotaoEnviar>
    </form>
  );
}
