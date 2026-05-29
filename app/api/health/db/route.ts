import { NextResponse } from "next/server";
import { getSqlService } from "@/lib/db/client";

// Sempre executa no servidor a cada requisição (não cacheia).
export const dynamic = "force-dynamic";

/**
 * Health-check do banco de dados.
 * Confirma que o app consegue conectar ao PostgreSQL e ler o schema.
 * Usa a conexão de serviço (ignora RLS) só para contar tabelas — não
 * expõe dado de cliente nenhum.
 */
export async function GET() {
  try {
    const sql = getSqlService();
    const [linha] = await sql<{ workspaces: number }[]>`
      select count(*)::int as workspaces from workspaces
    `;
    return NextResponse.json({
      ok: true,
      banco: "conectado",
      workspaces: linha.workspaces,
    });
  } catch (erro) {
    return NextResponse.json(
      {
        ok: false,
        banco: "erro",
        detalhe: erro instanceof Error ? erro.message : "desconhecido",
      },
      { status: 500 },
    );
  }
}
