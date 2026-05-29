import "server-only";
import bcrypt from "bcryptjs";

// Custo do bcrypt: 12 é um bom equilíbrio entre segurança e velocidade em 2026.
const SALT_ROUNDS = 12;

/** Gera o hash de uma senha em texto puro. */
export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

/** Confere uma senha em texto puro contra o hash armazenado. */
export async function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
