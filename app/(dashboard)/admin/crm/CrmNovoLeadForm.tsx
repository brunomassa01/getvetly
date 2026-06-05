"use client";

import { useFormState } from "react-dom";
import { Campo, CampoArea, Aviso, BotaoEnviar } from "@/components/auth/Campos";
import { ESTADO_INICIAL } from "@/lib/auth/tipos";
import { criarLeadAction } from "./actions";

export function CrmNovoLeadForm() {
  const [estado, action] = useFormState(criarLeadAction, ESTADO_INICIAL);

  return (
    <form action={action} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Campo label="Nome" name="nome" placeholder="Nome do prospect" required />
        <Campo
          label="E-mail"
          name="email"
          type="email"
          placeholder="email@exemplo.com"
          required
        />
      </div>
      <Campo
        label="Telefone (WhatsApp)"
        name="telefone"
        placeholder="(11) 99999-9999"
      />
      <CampoArea
        label="Observação (opcional)"
        name="observacao"
        placeholder="De onde veio, contexto da conversa..."
      />
      <Aviso erro={estado?.erro} sucesso={estado?.sucesso} />
      <div className="sm:w-48">
        <BotaoEnviar>Adicionar lead</BotaoEnviar>
      </div>
    </form>
  );
}
