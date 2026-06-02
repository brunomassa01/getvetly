"use client";

import { useFormState } from "react-dom";
import { Campo, Aviso, BotaoEnviar } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { aceitarConviteAction } from "./actions";

export function AceitarConviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [estado, action] = useFormState(aceitarConviteAction, ESTADO_INICIAL);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <label className="block">
        <span className="block text-sm font-medium text-texto-2 mb-1.5">
          E-mail
        </span>
        <input
          defaultValue={email}
          disabled
          className="w-full bg-paper-warm border border-[color:var(--border-subtle)] rounded-md px-3.5 py-2.5 text-sm text-texto-3"
        />
      </label>

      <Campo label="Seu nome" name="nome" placeholder="Como devemos te chamar" />
      <Campo
        label="Crie uma senha"
        name="senha"
        type="password"
        placeholder="Mínimo 6 caracteres"
      />

      <Aviso erro={estado?.erro} sucesso={estado?.sucesso} />
      <BotaoEnviar>Aceitar convite e entrar</BotaoEnviar>
    </form>
  );
}
