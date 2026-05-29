import { type DefaultSession } from "next-auth";

// Adiciona o `id` (UUID da nossa tabela auth.users) à sessão e ao token JWT.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
