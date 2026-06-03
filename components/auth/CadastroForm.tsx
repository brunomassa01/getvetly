"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { cadastrarAction } from "@/app/(auth)/actions";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { Campo, BotaoEnviar, Aviso } from "./Campos";
import { BotaoGoogle, Separador } from "./BotaoGoogle";

export function CadastroForm() {
  const [estado, action] = useFormState(cadastrarAction, ESTADO_INICIAL);

  return (
    <div className="space-y-5">
      <BotaoGoogle />
      <Separador />
      <form action={action} className="space-y-4">
        <Campo label="Seu nome" name="nome" autoComplete="name" required />
        <Campo
          label="Nome da empresa"
          name="empresa"
          autoComplete="organization"
          required
        />
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Aviso erro={estado?.erro} />
        <BotaoEnviar>Criar conta</BotaoEnviar>
      </form>
      <p className="text-sm text-texto-2 text-center">
        Já tem conta?{" "}
        <Link href="/login" className="text-ink font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
