import { z } from "zod";

// Validações de formulários de autenticação. Mensagens em PT-BR (user-facing).

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export const cadastroSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  senha: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres")
    .max(72, "A senha é longa demais"), // limite do bcrypt
  empresa: z.string().min(2, "Informe o nome da empresa"),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const redefinirSenhaSchema = z.object({
  token: z.string().min(1, "Token ausente"),
  senha: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres")
    .max(72, "A senha é longa demais"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
