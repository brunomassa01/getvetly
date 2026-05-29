import type { Metadata } from "next";
import Link from "next/link";
import { RedefinirSenhaForm } from "@/components/auth/RedefinirSenhaForm";

export const metadata: Metadata = { title: "Redefinir senha — Vetly" };

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  if (!token) {
    return (
      <>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">
          Link inválido
        </h1>
        <p className="text-sm text-texto-2 mb-6">
          O link de redefinição está incompleto ou expirou.
        </p>
        <Link
          href="/esqueci-senha"
          className="block text-center w-full font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep"
        >
          Solicitar novo link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">
        Nova senha
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Escolha uma senha com ao menos 8 caracteres.
      </p>
      <RedefinirSenhaForm token={token} />
    </>
  );
}
