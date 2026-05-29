import type { NextAuthConfig } from "next-auth";

// Configuração edge-safe do Auth.js — SEM provedores e SEM acesso a banco
// (bcrypt, postgres). Usada pelo middleware, que roda no edge runtime.
// Os provedores ficam em auth.ts (Node runtime).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Protege as rotas do painel: só entra quem está logado.
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user;
      const rotaProtegida = nextUrl.pathname.startsWith("/painel");
      if (rotaProtegida) return logado;
      return true;
    },
    // Propaga o id do usuário para o token e para a sessão.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [], // preenchidos em auth.ts
} satisfies NextAuthConfig;
