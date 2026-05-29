import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8" aria-label="Vetly — início">
        <Logo className="h-9 w-auto" />
      </Link>
      <div className="w-full max-w-sm bg-white border border-[color:var(--border-subtle)] rounded-xl shadow-md p-8">
        {children}
      </div>
    </main>
  );
}
