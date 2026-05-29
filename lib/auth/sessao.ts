import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Retorna o id do usuário logado (UUID da nossa auth.users).
 * Redireciona para /login se não houver sessão — use em Server Components
 * e Server Actions de áreas protegidas.
 */
export async function usuarioAtual(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}
