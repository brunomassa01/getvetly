"use client";

import { useFormState } from "react-dom";
import { Aviso, BotaoEnviar } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { convidarAction } from "@/app/(dashboard)/usuarios/actions";

const baseInput =
  "bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3";

export function ConvidarForm({ podeConvidar }: { podeConvidar: boolean }) {
  const [estado, action] = useFormState(convidarAction, ESTADO_INICIAL);

  if (!podeConvidar) {
    return (
      <div className="rounded-lg border border-[color:var(--border-default)] bg-paper-warm p-4 text-sm text-texto-2">
        Seu plano atingiu o limite de usuários. Faça{" "}
        <a href="/financeiro" className="text-ink font-medium underline">
          upgrade
        </a>{" "}
        para convidar mais pessoas.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="email@daempresa.com"
          className={`${baseInput} flex-1`}
        />
        <select name="role" defaultValue="member" className={baseInput}>
          <option value="member">Operador</option>
          <option value="admin">Administrador</option>
        </select>
        <div className="sm:w-40">
          <BotaoEnviar>Convidar</BotaoEnviar>
        </div>
      </div>
      <Aviso erro={estado?.erro} sucesso={estado?.sucesso} />
    </form>
  );
}
