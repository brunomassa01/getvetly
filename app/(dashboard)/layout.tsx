import Link from "next/link";
import { Logo } from "@/components/Logo";
import { auth } from "@/auth";
import { buscarPerfil } from "@/lib/auth/usuarios";
import { ehAdmin } from "@/lib/workspace/membros";
import { MenuPerfil } from "@/components/layout/MenuPerfil";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const nome = session?.user?.name ?? null;
  const email = session?.user?.email ?? null;
  const userId = session?.user?.id;
  const perfil = userId ? await buscarPerfil(userId) : null;
  const admin = userId ? await ehAdmin(userId) : false;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="print:hidden border-b border-[color:var(--border-subtle)]">
        <div className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/painel" aria-label="Vetly — início">
              <Logo className="h-7 w-auto" />
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/painel" className="text-texto-2 hover:text-ink transition-colors">
                Painel
              </Link>
              <Link
                href="/propostas"
                className="text-texto-2 hover:text-ink transition-colors"
              >
                Propostas
              </Link>
              <Link
                href="/comparativos"
                className="text-texto-2 hover:text-ink transition-colors"
              >
                Comparativos
              </Link>
              <Link
                href="/fornecedores"
                className="text-texto-2 hover:text-ink transition-colors"
              >
                Fornecedores
              </Link>
            </nav>
          </div>
          <MenuPerfil
            nome={nome}
            email={email}
            temAvatar={!!perfil?.avatar_url}
            admin={admin}
          />
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
