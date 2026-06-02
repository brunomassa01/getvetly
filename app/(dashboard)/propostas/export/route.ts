import { auth } from "@/auth";
import { listarPropostas } from "@/lib/propostas/db";
import { STATUS_PROPOSTA, ROTULO_SITUACAO } from "@/lib/propostas/schema";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";
import { codigoCurto, formatarData } from "@/lib/format";
import { paraCsv, respostaCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Não autorizado", { status: 401 });

  const propostas = await listarPropostas(session.user.id);
  const csv = paraCsv(
    ["Código", "Proposta", "Fornecedor", "Categoria", "Valor negociado", "Status", "Situação", "Criada em"],
    propostas.map((p) => [
      codigoCurto(p.id),
      p.titulo,
      p.fornecedor_nome ?? "",
      ROTULO_CATEGORIA[p.categoria as Categoria] ?? p.categoria,
      p.valor_negociado ?? "",
      STATUS_PROPOSTA[p.status] ?? p.status,
      ROTULO_SITUACAO[p.situacao] ?? p.situacao,
      formatarData(p.created_at),
    ]),
  );

  return respostaCsv(csv, "propostas.csv");
}
