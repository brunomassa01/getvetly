"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { esqueciSenhaAction } from "@/app/(auth)/actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { Campo, BotaoEnviar, Aviso } from "./Campos";

export function EsqueciSenhaForm() {
  const [estado, action] = useFormState(esqueciSenhaAction, ESTADO_INICIAL);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <Campo
          label="E-mail da conta"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Aviso erro={estado.erro} sucesso={estado.sucesso} />
        <BotaoEnviar>Enviar link de recuperação</BotaoEnviar>
      </form>
      <p className="text-sm text-texto-2 text-center">
        <Link href="/login" className="text-ink font-medium hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
