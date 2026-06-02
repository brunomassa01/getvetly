import { auth } from "@/auth";
import { listarFornecedores } from "@/lib/fornecedores/db";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { paraCsv, respostaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Não autorizado", { status: 401 });

  const fornecedores = await listarFornecedores(session.user.id);
  const csv = paraCsv(
    ["Nome", "CNPJ", "E-mail", "Telefone", "Categoria", "Cotações", "Economia gerada", "Desconto médio"],
    fornecedores.map((f) => [
      f.nome,
      f.cnpj,
      f.email,
      f.telefone,
      f.segmento ? (ROTULO_CATEGORIA[f.segmento as Categoria] ?? f.segmento) : "",
      f.cotacoes ?? 0,
      f.economia_total ?? "",
      f.desconto_medio != null ? `${f.desconto_medio}%` : "",
    ]),
  );

  return respostaCsv(csv, "fornecedores.csv");
}
