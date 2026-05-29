import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware usa só a config edge-safe (sem provedores/banco). O callback
// `authorized` em auth.config.ts decide o que é protegido (/painel).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Roda em todas as rotas, exceto assets estáticos e as rotas internas do Auth.js.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
