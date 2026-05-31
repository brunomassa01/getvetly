import type { Metadata } from "next";
import { EmBreve } from "@/components/EmBreve";

export const metadata: Metadata = { title: "Gestão de Usuários — Vetly" };

export default function UsuariosPage() {
  return (
    <EmBreve
      titulo="Gestão de Usuários"
      descricao="Convide pessoas da sua equipe e defina permissões. Em desenvolvimento."
    />
  );
}
