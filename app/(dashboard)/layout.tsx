import Link from "next/link";
import { Logo } from "@/components/Logo";
import { sairAction } from "@/app/(auth)/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[color:var(--border-subtle)]">
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
              <Link
                href="/configuracoes"
                className="text-texto-2 hover:text-ink transition-colors"
              >
                Configurações
              </Link>
            </nav>
          </div>
          <form action={sairAction}>
            <button
              type="submit"
              className="text-sm font-medium text-texto-2 hover:text-ink transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
