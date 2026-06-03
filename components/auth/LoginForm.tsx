"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { entrarAction } from "@/app/(auth)/actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { Campo, BotaoEnviar, Aviso } from "./Campos";
import { BotaoGoogle, Separador } from "./BotaoGoogle";

export function LoginForm() {
  const [estado, action] = useFormState(entrarAction, ESTADO_INICIAL);

  return (
    <div className="space-y-5">
      <BotaoGoogle />
      <Separador />
      <form action={action} className="space-y-4">
        <Campo
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Campo
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
        <Aviso erro={estado?.erro} />
        <BotaoEnviar>Entrar</BotaoEnviar>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/esqueci-senha" className="text-texto-2 hover:text-ink">
          Esqueci a senha
        </Link>
        <Link href="/cadastro" className="text-texto-2 hover:text-ink">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
