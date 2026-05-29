import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/auth/schemas";
import {
  buscarUsuarioPorEmail,
  encontrarOuCriarUsuarioOAuth,
} from "@/lib/auth/usuarios";
import { verificarSenha } from "@/lib/auth/hash";

// Provedor Google só é ativado quando as credenciais existem. Assim o login
// por e-mail/senha funciona mesmo antes de configurarmos o Google OAuth.
const provedores: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  provedores.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...provedores,
    // Login com e-mail e senha.
    Credentials({
      credentials: {
        email: {},
        senha: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await buscarUsuarioPorEmail(parsed.data.email);
        if (!usuario?.senha_hash) return null;

        const senhaCorreta = await verificarSenha(
          parsed.data.senha,
          usuario.senha_hash,
        );
        if (!senhaCorreta) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Para login Google: garante que o usuário exista na nossa auth.users e
    // usa o NOSSO UUID como id da sessão (essencial para o RLS).
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const nosso = await encontrarOuCriarUsuarioOAuth({
          email: user.email,
          nome: user.name ?? null,
          avatar: user.image ?? null,
        });
        user.id = nosso.id;
      }
      return true;
    },
  },
});
