import type { Metadata } from "next";
import { EsqueciSenhaForm } from "@/components/auth/EsqueciSenhaForm";

export const metadata: Metadata = { title: "Recuperar senha — Vetly" };

export default function EsqueciSenhaPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">
        Recuperar senha
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Enviaremos um link para você criar uma nova senha.
      </p>
      <EsqueciSenhaForm />
    </>
  );
}
