import type { Metadata } from "next";
import { EmBreve } from "@/components/EmBreve";

export const metadata: Metadata = { title: "Conta — Vetly" };

export default function ContaPage() {
  return (
    <EmBreve
      titulo="Sua conta"
      descricao="Edição do seu perfil (nome, foto e dados de acesso). Estamos preparando esta área."
    />
  );
}
