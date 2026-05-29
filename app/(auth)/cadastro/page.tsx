import type { Metadata } from "next";
import { CadastroForm } from "@/components/auth/CadastroForm";

export const metadata: Metadata = { title: "Criar conta — Vetly" };

export default function CadastroPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">
        Criar conta
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Comece a analisar propostas com a Vetly.
      </p>
      <CadastroForm />
    </>
  );
}
