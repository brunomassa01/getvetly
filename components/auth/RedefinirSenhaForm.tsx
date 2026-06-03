"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { redefinirSenhaAction } from "@/app/(auth)/actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { Campo, BotaoEnviar, Aviso } from "./Campos";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [estado, action] = useFormState(redefinirSenhaAction, ESTADO_INICIAL);

  // Após sucesso, mostra o caminho para o login em vez do formulário.
  if (estado?.sucesso) {
    return (
      <div className="space-y-5">
        <Aviso sucesso={estado?.sucesso} />
        <Link
          href="/login"
          className="block text-center w-full font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Campo
        label="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Aviso erro={estado?.erro} />
      <BotaoEnviar>Redefinir senha</BotaoEnviar>
    </form>
  );
}
