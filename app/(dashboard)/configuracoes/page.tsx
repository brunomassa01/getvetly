import type { Metadata } from "next";
import { usuarioAtual } from "@/lib/auth/sessao";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { ConfiguracoesForm } from "@/components/configuracoes/ConfiguracoesForm";

export const metadata: Metadata = { title: "Configurações — Vetly" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const userId = await usuarioAtual();
  const workspace = await buscarWorkspaceDoUsuario(userId);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mb-2">
        Configurações da empresa
      </h1>
      <p className="text-sm text-texto-2 mb-6">
        Dados do seu workspace e personalização dos relatórios.
      </p>

      {workspace ? (
        <ConfiguracoesForm workspace={workspace} />
      ) : (
        <p className="text-sm text-texto-2">
          Não foi possível carregar os dados da empresa.
        </p>
      )}
    </div>
  );
}
