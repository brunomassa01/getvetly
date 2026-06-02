import "server-only";
import { randomBytes } from "node:crypto";
import { withUser, getSqlService } from "@/lib/db/client";
import { ehEmailInterno } from "@/lib/auth/interno";
import { limiteAssentos, type Plano } from "@/lib/stripe/config";

export interface Membro {
  id: string;
  user_id: string;
  nome: string | null;
  email: string;
  role: string; // 'admin' | 'member'
  created_at: string;
}

export interface ConvitePendente {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface InfoAssentos {
  usados: number; // membros ativos + convites pendentes
  limite: number; // Infinity = ilimitado (vitalício)
  vitalicio: boolean;
}

/** Papel do usuário no seu workspace ativo. null se não for membro. */
export async function papelDoUsuario(userId: string): Promise<string | null> {
  return withUser(userId, async (sql) => {
    const [m] = await sql<{ role: string }[]>`
      select role from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    return m?.role ?? null;
  });
}

export async function ehAdmin(userId: string): Promise<boolean> {
  return (await papelDoUsuario(userId)) === "admin";
}

/** Membros ativos do workspace (admin primeiro, depois por data). */
export async function listarMembros(userId: string): Promise<Membro[]> {
  return withUser(userId, (sql) =>
    sql<Membro[]>`
      select id, user_id, nome, email, role, created_at
      from workspace_members
      where ativo = true
      order by (role = 'admin') desc, created_at asc
    `,
  );
}

/** Convites ainda não aceitos e não expirados. */
export async function listarConvitesPendentes(
  userId: string,
): Promise<ConvitePendente[]> {
  return withUser(userId, (sql) =>
    sql<ConvitePendente[]>`
      select id, email, role, created_at
      from workspace_convites
      where aceito_em is null and expira_em > now()
      order by created_at desc
    `,
  );
}

/** Quantos assentos o workspace usa e quantos o plano permite. */
export async function infoAssentos(userId: string): Promise<InfoAssentos> {
  return withUser(userId, async (sql) => {
    const [w] = await sql<
      { workspace_id: string; status: string; plano: string | null }[]
    >`
      select m.workspace_id, w.assinatura_status as status, w.plano
      from workspace_members m
      join workspaces w on w.id = m.workspace_id
      where m.user_id = ${userId} and m.ativo = true
      limit 1
    `;
    if (!w) return { usados: 0, limite: 1, vitalicio: false };

    // Vitalício se algum admin ativo do workspace é e-mail interno.
    const admins = await sql<{ email: string }[]>`
      select email from workspace_members
      where workspace_id = ${w.workspace_id} and ativo = true and role = 'admin'
    `;
    const vitalicio = admins.some((a) => ehEmailInterno(a.email));

    const [membros] = await sql<{ n: number }[]>`
      select count(*)::int as n from workspace_members
      where workspace_id = ${w.workspace_id} and ativo = true
    `;
    const [convites] = await sql<{ n: number }[]>`
      select count(*)::int as n from workspace_convites
      where workspace_id = ${w.workspace_id}
        and aceito_em is null and expira_em > now()
    `;

    return {
      usados: (membros?.n ?? 0) + (convites?.n ?? 0),
      limite: limiteAssentos(w.status, w.plano as Plano | null, vitalicio),
      vitalicio,
    };
  });
}

export interface ResultadoConvite {
  ok: boolean;
  erro?: string;
  token?: string;
  workspaceNome?: string;
}

/**
 * Cria um convite (somente admin), respeitando o limite de assentos do plano.
 * Token gerado no Node (hex). Não convida quem já é membro/convidado.
 */
export async function criarConvite(
  userId: string,
  emailBruto: string,
  role: "admin" | "member",
): Promise<ResultadoConvite> {
  const email = emailBruto.trim().toLowerCase();
  if (!email) return { ok: false, erro: "Informe o e-mail." };

  return withUser(userId, async (sql) => {
    const [membro] = await sql<
      { workspace_id: string; role: string }[]
    >`
      select workspace_id, role from workspace_members
      where user_id = ${userId} and ativo = true
      limit 1
    `;
    if (!membro || membro.role !== "admin") {
      return { ok: false, erro: "Só administradores podem convidar." };
    }
    const wsId = membro.workspace_id;

    // Limite de assentos
    const info = await infoAssentos(userId);
    if (info.usados >= info.limite) {
      return {
        ok: false,
        erro:
          "Seu plano atingiu o limite de usuários. Faça upgrade para convidar mais.",
      };
    }

    // Já é membro ativo?
    const [jaMembro] = await sql<{ id: string }[]>`
      select id from workspace_members
      where workspace_id = ${wsId} and lower(email) = ${email} and ativo = true
      limit 1
    `;
    if (jaMembro) {
      return { ok: false, erro: "Esse e-mail já faz parte da equipe." };
    }

    // Já existe convite pendente?
    const [jaConvite] = await sql<{ id: string }[]>`
      select id from workspace_convites
      where workspace_id = ${wsId} and lower(email) = ${email}
        and aceito_em is null and expira_em > now()
      limit 1
    `;
    if (jaConvite) {
      return { ok: false, erro: "Já existe um convite pendente para esse e-mail." };
    }

    const token = randomBytes(32).toString("hex");
    await sql`
      insert into workspace_convites (workspace_id, email, role, token, convidado_por)
      values (${wsId}, ${email}, ${role}, ${token}, ${userId})
    `;
    const [ws] = await sql<{ nome: string }[]>`
      select nome from workspaces where id = ${wsId}
    `;
    return { ok: true, token, workspaceNome: ws?.nome ?? "a empresa" };
  });
}

/** Desativa um membro (admin; não pode remover a si mesmo nem o último admin). */
export async function removerMembro(
  userId: string,
  membroId: string,
): Promise<{ ok: boolean; erro?: string }> {
  return withUser(userId, async (sql) => {
    const [admin] = await sql<{ role: string }[]>`
      select role from workspace_members
      where user_id = ${userId} and ativo = true limit 1
    `;
    if (!admin || admin.role !== "admin") {
      return { ok: false, erro: "Sem permissão." };
    }
    const [alvo] = await sql<{ user_id: string; role: string }[]>`
      select user_id, role from workspace_members where id = ${membroId} and ativo = true
    `;
    if (!alvo) return { ok: false, erro: "Membro não encontrado." };
    if (alvo.user_id === userId) {
      return { ok: false, erro: "Você não pode remover a si mesmo." };
    }
    if (alvo.role === "admin") {
      const [c] = await sql<{ n: number }[]>`
        select count(*)::int as n from workspace_members
        where ativo = true and role = 'admin'
      `;
      if ((c?.n ?? 0) <= 1) {
        return { ok: false, erro: "Não dá para remover o último administrador." };
      }
    }
    await sql`update workspace_members set ativo = false where id = ${membroId}`;
    return { ok: true };
  });
}

/** Revoga um convite pendente (admin). */
export async function revogarConvite(
  userId: string,
  conviteId: string,
): Promise<void> {
  await withUser(userId, async (sql) => {
    const [admin] = await sql<{ role: string }[]>`
      select role from workspace_members
      where user_id = ${userId} and ativo = true limit 1
    `;
    if (!admin || admin.role !== "admin") return;
    await sql`delete from workspace_convites where id = ${conviteId}`;
  });
}

export interface ConviteAberto {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  workspace_nome: string;
}

/** Busca um convite válido pelo token (SERVICE — página pública de aceite). */
export async function buscarConvitePorToken(
  token: string,
): Promise<ConviteAberto | null> {
  const sql = getSqlService();
  const [c] = await sql<ConviteAberto[]>`
    select c.id, c.workspace_id, c.email, c.role, w.nome as workspace_nome
    from workspace_convites c
    join workspaces w on w.id = c.workspace_id
    where c.token = ${token} and c.aceito_em is null and c.expira_em > now()
  `;
  return c ?? null;
}
