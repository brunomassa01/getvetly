import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { usuarioAtual } from "@/lib/auth/sessao";
import { contagensPainel } from "@/lib/workspace/db";

export const metadata: Metadata = { title: "Painel — Vetly" };
export const dynamic = "force-dynamic";

function CardLink({
  href,
  titulo,
  descricao,
  contagem,
}: {
  href: string;
  titulo: string;
  descricao: string;
  contagem?: number;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-[color:var(--border-subtle)] rounded-xl p-5 hover:border-lime-deep hover:shadow-md transition-all"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display font-bold text-ink">{titulo}</span>
        {contagem !== undefined && (
          <span className="font-display font-extrabold text-2xl text-ink tracking-tighter">
            {contagem}
          </span>
        )}
      </div>
      <p className="text-sm text-texto-2 mt-1">{descricao}</p>
    </Link>
  );
}

export default async function PainelPage() {
  const userId = await usuarioAtual();
  const session = await auth();
  const nome = session?.user?.name ?? session?.user?.email ?? "você";
  const contagens = await contagensPainel(userId);

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wide2 uppercase text-[#5C7A0E] bg-lime-faint border border-lime-soft rounded-full px-3 py-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-deep" />
          Conta ativa
        </span>
        <h1 className="font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Olá, {nome}.
        </h1>
        <p className="mt-2 text-base text-texto-2">
          Analise propostas comerciais com leitura crítica por IA.
        </p>
      </div>

      {/* Ação principal — propósito do Vetly */}
      <Link
        href="/propostas/nova"
        className="block rounded-xl bg-ink text-paper p-6 sm:p-8 hover:bg-black transition-colors"
      >
        <span className="font-mono text-[11px] tracking-wide2 uppercase text-lime">
          Comece por aqui
        </span>
        <p className="font-display font-extrabold text-2xl sm:text-3xl tracking-tighter mt-2">
          Analisar nova proposta →
        </p>
        <p className="text-sm text-paper/70 mt-2 max-w-lg">
          Suba o(s) arquivo(s) do fornecedor — a IA extrai os dados e entrega um
          relatório com leitura crítica.
        </p>
      </Link>

      {/* Atalhos */}
      <div className="grid sm:grid-cols-3 gap-4">
        <CardLink
          href="/propostas"
          titulo="Propostas"
          descricao="Veja e analise suas propostas"
          contagem={contagens.propostas}
        />
        <CardLink
          href="/comparativos"
          titulo="Comparativos"
          descricao="Compare e decida pelo seu critério"
          contagem={contagens.comparativos}
        />
        <CardLink
          href="/fornecedores"
          titulo="Fornecedores"
          descricao="Histórico de quem já cotou"
          contagem={contagens.fornecedores}
        />
      </div>

      {/* Configurar empresa */}
      <CardLink
        href="/configuracoes"
        titulo="Configurar empresa"
        descricao="Nome, CNPJ, segmento e marca dos relatórios"
      />
    </div>
  );
}
