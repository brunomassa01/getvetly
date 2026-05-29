"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import {
  cadastroSchema,
  esqueciSenhaSchema,
  redefinirSenhaSchema,
} from "@/lib/auth/schemas";
import {
  buscarUsuarioPorEmail,
  criarUsuarioComWorkspace,
  criarTokenReset,
  redefinirSenhaComToken,
} from "@/lib/auth/usuarios";
import { gerarHashSenha } from "@/lib/auth/hash";
import { enviarEmail, emailRecuperacaoSenha } from "@/lib/email/enviar";
import type { EstadoForm } from "@/lib/auth/tipos";

/** Login com e-mail e senha. */
export async function entrarAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  try {
    await signIn("credentials", { email, senha, redirectTo: "/painel" });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "E-mail ou senha incorretos." };
    }
    throw erro; // re-lança o redirect de sucesso
  }
  return {};
}

/** Cadastro: cria usuário + workspace e já loga. */
export async function cadastrarAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = cadastroSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    empresa: String(formData.get("empresa") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existente = await buscarUsuarioPorEmail(parsed.data.email);
  if (existente) {
    return { erro: "Já existe uma conta com este e-mail." };
  }

  const senhaHash = await gerarHashSenha(parsed.data.senha);
  try {
    await criarUsuarioComWorkspace({
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      empresa: parsed.data.empresa,
    });
  } catch {
    return { erro: "Não foi possível criar a conta. Tente novamente." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      senha: parsed.data.senha,
      redirectTo: "/painel",
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "Conta criada, mas falha ao entrar. Faça login." };
    }
    throw erro;
  }
  return {};
}

/** Esqueci a senha: gera token e envia e-mail (não revela se o e-mail existe). */
export async function esqueciSenhaAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = esqueciSenhaSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "E-mail inválido." };
  }

  const resultado = await criarTokenReset(parsed.data.email);
  if (resultado) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = `${base}/redefinir-senha?token=${resultado.token}`;
    const { assunto, html } = emailRecuperacaoSenha(link);
    await enviarEmail({ para: resultado.usuario.email, assunto, html });
  }

  return {
    sucesso:
      "Se houver uma conta com este e-mail, enviamos um link de recuperação.",
  };
}

/** Redefine a senha a partir do token do e-mail. */
export async function redefinirSenhaAction(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = redefinirSenhaSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    senha: String(formData.get("senha") ?? ""),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const senhaHash = await gerarHashSenha(parsed.data.senha);
  const ok = await redefinirSenhaComToken(parsed.data.token, senhaHash);
  if (!ok) {
    return { erro: "Link inválido ou expirado. Solicite um novo." };
  }

  return { sucesso: "Senha redefinida! Você já pode entrar." };
}

/** Login com Google (Gmail). */
export async function entrarComGoogleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/painel" });
}

/** Logout. */
export async function sairAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
