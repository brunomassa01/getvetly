import "server-only";
import postgres, { type Sql, type TransactionSql } from "postgres";

// Evita criar múltiplos pools de conexão durante o hot-reload do Next em dev.
const globalForDb = globalThis as unknown as {
  sqlApp?: Sql;
  sqlService?: Sql;
};

function criarConexao(url: string | undefined, nome: string): Sql {
  if (!url) {
    throw new Error(
      `Variável de ambiente ${nome} não definida. Veja .env.example.`,
    );
  }
  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

/**
 * Conexão da APLICAÇÃO — respeita o Row-Level Security (role getvetly_app).
 * Use sempre dentro de `withUser` para que o RLS saiba quem é o usuário.
 */
export const sqlApp: Sql =
  globalForDb.sqlApp ?? criarConexao(process.env.DATABASE_URL, "DATABASE_URL");

/**
 * Conexão de SERVIÇO — ignora o RLS (role getvetly_service, BYPASSRLS).
 * Use APENAS no servidor: worker de IA, telemetria e rotas públicas
 * validadas por token (ex: /r/[token]). Nunca para dados do usuário comum.
 */
export const sqlService: Sql =
  globalForDb.sqlService ??
  criarConexao(process.env.DATABASE_URL_SERVICE, "DATABASE_URL_SERVICE");

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlApp = sqlApp;
  globalForDb.sqlService = sqlService;
}

/**
 * Executa queries no contexto de um usuário, com o RLS aplicado.
 *
 * Abre uma transação, define a variável de sessão `app.current_user_id`
 * (lida pela função auth.uid() nas políticas de RLS) e roda a função
 * fornecida na MESMA conexão. Assim o usuário só enxerga dados dos
 * workspaces onde é membro ativo.
 *
 * @example
 *   const propostas = await withUser(userId, (sql) =>
 *     sql`select * from propostas`
 *   );
 */
export async function withUser<T>(
  userId: string,
  fn: (sql: TransactionSql) => Promise<T>,
): Promise<T> {
  const resultado = await sqlApp.begin(async (sql) => {
    await sql`select set_config('app.current_user_id', ${userId}, true)`;
    return fn(sql);
  });
  return resultado as unknown as T;
}
