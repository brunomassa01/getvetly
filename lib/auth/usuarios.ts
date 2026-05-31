import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { getSqlService } from "@/lib/db/client";

export interface Usuario {
  id: string;
  email: string;
  nome: string | null;
  senha_hash: string | null;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface Perfil {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
}

/** Dados do perfil do usuário (tela "Conta"). */
export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const sql = getSqlService();
  const [p] = await sql<Perfil[]>`
    select id, email, nome, telefone, avatar_url
    from auth.users where id = ${userId}
  `;
  return p ?? null;
}

/** Atualiza nome e telefone do usuário (e-mail é a identidade — não muda aqui). */
export async function atualizarPerfil(
  userId: string,
  dados: { nome: string | null; telefone: string | null },
): Promise<void> {
  const sql = getSqlService();
  await sql`
    update auth.users set nome = ${dados.nome}, telefone = ${dados.telefone}
    where id = ${userId}
  `;
}

/** Grava o caminho/URL da foto de perfil. */
export async function salvarAvatarPerfil(
  userId: string,
  caminho: string,
): Promise<void> {
  const sql = getSqlService();
  await sql`update auth.users set avatar_url = ${caminho} where id = ${userId}`;
}

/** Busca um usuário pelo e-mail. Retorna null se não existir. */
export async function buscarUsuarioPorEmail(
  email: string,
): Promise<Usuario | null> {
  const sql = getSqlService();
  const [usuario] = await sql<Usuario[]>`
    select id, email, nome, senha_hash
    from auth.users
    where email = ${normalizarEmail(email)}
  `;
  return usuario ?? null;
}

/**
 * Cria um usuário (e-mail/senha) junto com o primeiro workspace da empresa
 * e o vínculo de admin — tudo em uma transação. Lança erro se o e-mail já
 * existir (constraint unique).
 */
export async function criarUsuarioComWorkspace(input: {
  nome: string;
  email: string;
  senhaHash: string;
  empresa: string;
}): Promise<{ id: string; email: string }> {
  const sql = getSqlService();
  const email = normalizarEmail(input.email);

  const resultado = await sql.begin(async (tx) => {
    const [usuario] = await tx<{ id: string; email: string }[]>`
      insert into auth.users (email, senha_hash, nome)
      values (${email}, ${input.senhaHash}, ${input.nome})
      returning id, email
    `;
    const [workspace] = await tx<{ id: string }[]>`
      insert into workspaces (nome) values (${input.empresa})
      returning id
    `;
    await tx`
      insert into workspace_members (workspace_id, user_id, role, nome, email)
      values (${workspace.id}, ${usuario.id}, 'admin', ${input.nome}, ${email})
    `;
    return usuario;
  });

  return resultado as unknown as { id: string; email: string };
}

/**
 * Para login OAuth (Google): encontra o usuário pelo e-mail ou cria um novo
 * (com workspace) na primeira vez. E-mails do Google já vêm verificados.
 */
export async function encontrarOuCriarUsuarioOAuth(input: {
  email: string;
  nome: string | null;
  avatar: string | null;
}): Promise<{ id: string }> {
  const sql = getSqlService();
  const email = normalizarEmail(input.email);

  const [existente] = await sql<{ id: string }[]>`
    select id from auth.users where email = ${email}
  `;
  if (existente) return existente;

  const resultado = await sql.begin(async (tx) => {
    const [usuario] = await tx<{ id: string }[]>`
      insert into auth.users (email, nome, avatar_url, email_verificado_em)
      values (${email}, ${input.nome}, ${input.avatar}, now())
      returning id
    `;
    const [workspace] = await tx<{ id: string }[]>`
      insert into workspaces (nome) values (${input.nome ?? "Minha empresa"})
      returning id
    `;
    await tx`
      insert into workspace_members (workspace_id, user_id, role, nome, email)
      values (${workspace.id}, ${usuario.id}, 'admin', ${input.nome}, ${email})
    `;
    return usuario;
  });

  return resultado as unknown as { id: string };
}

/**
 * Cria um token de recuperação de senha. Guarda apenas o hash (sha256) do
 * token; retorna o token cru (para o link do e-mail) e o usuário.
 * Retorna null se o e-mail não existir (o chamador não deve revelar isso).
 */
export async function criarTokenReset(email: string): Promise<{
  token: string;
  usuario: Usuario;
} | null> {
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) return null;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const sql = getSqlService();
  await sql`
    insert into auth.password_reset_tokens (user_id, token_hash, expira_em)
    values (${usuario.id}, ${tokenHash}, now() + interval '1 hour')
  `;

  return { token, usuario };
}

/**
 * Consome um token de recuperação e troca a senha do usuário, em transação.
 * Retorna false se o token for inválido, expirado ou já usado.
 */
export async function redefinirSenhaComToken(
  token: string,
  novaSenhaHash: string,
): Promise<boolean> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const sql = getSqlService();

  const ok = await sql.begin(async (tx) => {
    const [registro] = await tx<{ id: string; user_id: string }[]>`
      select id, user_id
      from auth.password_reset_tokens
      where token_hash = ${tokenHash}
        and usado_em is null
        and expira_em > now()
      for update
    `;
    if (!registro) return false;

    await tx`
      update auth.users set senha_hash = ${novaSenhaHash}
      where id = ${registro.user_id}
    `;
    await tx`
      update auth.password_reset_tokens set usado_em = now()
      where id = ${registro.id}
    `;
    return true;
  });

  return ok as unknown as boolean;
}
