import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buscarComparativo } from "@/lib/comparativos/db";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { gerarPptxComparativo } from "@/lib/comparativos/pptx";

export const dynamic = "force-dynamic";

function nomeArquivo(titulo: string): string {
  const slug =
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "comparativo";
  return `${slug}.pptx`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  const userId = session.user.id;

  const comparativo = await buscarComparativo(userId, params.id);
  if (!comparativo) {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  const ws = await buscarWorkspaceDoUsuario(userId);
  const empresa = ws?.whitelabel_empresa_nome || ws?.nome || null;

  const buffer = await gerarPptxComparativo(
    comparativo.payload,
    comparativo.titulo,
    empresa,
    {
      fundo: ws?.whitelabel_cor_primaria,
      destaque: ws?.whitelabel_cor_secundaria,
    },
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${nomeArquivo(comparativo.titulo)}"`,
    },
  });
}
