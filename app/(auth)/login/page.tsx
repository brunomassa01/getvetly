import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Entrar — Vetly" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">Entrar</h1>
      <p className="text-sm text-texto-2 mb-6">Acesse sua conta Vetly.</p>
      <LoginForm />
    </>
  );
}
