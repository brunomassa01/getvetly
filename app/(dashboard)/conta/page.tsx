import type { Metadata } from "next";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarPerfil } from "@/lib/auth/usuarios";
import { ContaForm } from "@/components/conta/ContaForm";

export const metadata: Metadata = { title: "Conta — Vetly" };
export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const userId = await usuarioAtual();
  const perfil = await buscarPerfil(userId);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
        Sua conta
      </h1>
      <p className="text-sm text-texto-2 mt-1 mb-6">
        Seus dados de perfil.
      </p>
      <ContaForm
        nome={perfil?.nome ?? null}
        email={perfil?.email ?? ""}
        telefone={perfil?.telefone ?? null}
        temAvatar={!!perfil?.avatar_url}
      />
    </div>
  );
}
