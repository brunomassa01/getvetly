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
    // Tudo é protegido por padrão, exceto rotas públicas explícitas.
    authorized({ auth, request: { nextUrl } }) {
      const logado = !!auth?.user;
      const path = nextUrl.pathname;

      const rotasPublicas = [
        "/",
        "/login",
        "/cadastro",
        "/esqueci-senha",
        "/redefinir-senha",
      ];
      const ehPublica =
        rotasPublicas.includes(path) ||
        path.startsWith("/r/") || // páginas públicas de revisão (link compartilhável)
        path.startsWith("/convite/") || // aceite de convite (cria conta entrando no workspace)
        path.startsWith("/api"); // APIs cuidam da própria autenticação

      if (ehPublica) return true;
      return logado;
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
