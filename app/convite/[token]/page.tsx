import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buscarConvitePorToken } from "@/lib/workspace/membros";
import { buscarUsuarioPorEmail } from "@/lib/auth/usuarios";
import { AceitarConviteForm } from "./AceitarConviteForm";

export const metadata: Metadata = { title: "Convite — Vetly" };
export const dynamic = "force-dynamic";

export default async function ConvitePage({
  params,
}: {
  params: { token: string };
}) {
  const convite = await buscarConvitePorToken(params.token);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo className="h-8 w-auto" />
        </div>

        {!convite ? (
          <div className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-8 text-center">
            <h1 className="font-display font-extrabold text-ink text-xl tracking-tighter">
              Convite inválido ou expirado
            </h1>
            <p className="text-sm text-texto-2 mt-2">
              Peça à empresa para enviar um novo convite.
            </p>
            <Link
              href="/login"
              className="inline-block mt-5 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[color:var(--border-subtle)] rounded-xl p-8">
            <h1 className="font-display font-extrabold text-ink text-xl tracking-tighter">
              Você foi convidado para {convite.workspace_nome}
            </h1>
            <p className="text-sm text-texto-2 mt-2 mb-6">
              Crie sua conta para começar a usar a Vetly com a equipe.
            </p>

            {(await buscarUsuarioPorEmail(convite.email)) ? (
              <div className="text-sm text-texto-2">
                <p>
                  Já existe uma conta com <strong>{convite.email}</strong>.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-4 font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md hover:bg-lime-deep transition-colors"
                >
                  Fazer login
                </Link>
              </div>
            ) : (
              <AceitarConviteForm token={params.token} email={convite.email} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
