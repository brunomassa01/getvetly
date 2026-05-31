import type { Metadata } from "next";
import { EmBreve } from "@/components/EmBreve";

export const metadata: Metadata = { title: "Ajuda — Vetly" };

export default function AjudaPage() {
  return (
    <EmBreve
      titulo="Central de Ajuda"
      descricao="Tutoriais, dúvidas frequentes e suporte. Em breve, com assistente por IA."
    />
  );
}
