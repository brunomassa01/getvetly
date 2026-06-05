import "server-only";
import { z } from "zod";
import { getSqlService } from "@/lib/db/client";

// Mini-CRM de prospects (Admin interno). Tabela `leads` é global ao negócio,
// sem workspace_id, acessada só pelo service role. Veja 0008_leads.sql.

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  observacao: string | null;
  origem: string;
  convidado_em: string | null;
  created_at: string;
  tem_conta: boolean; // calculado: o e-mail já virou conta de verdade?
}

// Validação do formulário de novo lead. Mensagens em PT-BR (user-facing).
export const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do lead."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone longo demais.")
    .optional()
    .transform((v) => (v ? v : null)),
  observacao: z
    .string()
    .trim()
    .max(500, "Observação longa demais.")
    .optional()
    .transform((v) => (v ? v : null)),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Lista todos os leads, com a marca de quem já virou conta (join em auth.users). */
export async function listarLeads(): Promise<Lead[]> {
  const sql = getSqlService();
  return sql<Lead[]>`
    select
      l.id, l.nome, l.email, l.telefone, l.observacao,
      l.origem, l.convidado_em, l.created_at,
      (u.id is not null) as tem_conta
    from leads l
    left join auth.users u on lower(u.email) = lower(l.email)
    order by l.created_at desc
  `;
}

/** Busca um lead pelo id (para montar o convite). null se não existir. */
export async function buscarLead(id: string): Promise<Lead | null> {
  const sql = getSqlService();
  const [lead] = await sql<Lead[]>`
    select
      l.id, l.nome, l.email, l.telefone, l.observacao,
      l.origem, l.convidado_em, l.created_at,
      (u.id is not null) as tem_conta
    from leads l
    left join auth.users u on lower(u.email) = lower(l.email)
    where l.id = ${id}
  `;
  return lead ?? null;
}

/** Cria um lead. Recusa e-mail duplicado (um prospect por e-mail). */
export async function criarLead(
  dados: LeadInput,
): Promise<{ ok: boolean; erro?: string; id?: string }> {
  const sql = getSqlService();

  const [existe] = await sql<{ id: string }[]>`
    select id from leads where lower(email) = ${dados.email}
  `;
  if (existe) return { ok: false, erro: "Já existe um lead com este e-mail." };

  const [lead] = await sql<{ id: string }[]>`
    insert into leads (nome, email, telefone, observacao)
    values (${dados.nome}, ${dados.email}, ${dados.telefone}, ${dados.observacao})
    returning id
  `;
  return { ok: true, id: lead.id };
}

/** Marca que o convite de teste foi enviado para o lead. */
export async function marcarConvidado(id: string): Promise<void> {
  const sql = getSqlService();
  await sql`update leads set convidado_em = now() where id = ${id}`;
}

/** Remove um lead do CRM. */
export async function removerLead(id: string): Promise<void> {
  const sql = getSqlService();
  await sql`delete from leads where id = ${id}`;
}

/** URL de cadastro com nome e e-mail do lead já preenchidos (teste grátis). */
export function montarLinkTeste(email: string, nome: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const q = new URLSearchParams({ email, nome });
  return `${base}/cadastro?${q.toString()}`;
}

/** Texto pronto do convite por WhatsApp (com o link de teste). */
export function mensagemWhatsappTeste(nome: string, link: string): string {
  const oi = nome.split(" ")[0] || nome;
  return (
    `Oi, ${oi}! Aqui é da Vetly. 👋\n\n` +
    `Preparei um acesso de teste grátis pra você analisar propostas comerciais ` +
    `com inteligência artificial em segundos. É só criar sua conta aqui:\n\n${link}`
  );
}
