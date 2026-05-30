import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buscarComparativo, garantirDeck } from "@/lib/comparativos/db";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { lerLogo, dimensoesImagem } from "@/lib/workspace/logo";
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

  // Logo da empresa para a capa (PowerPoint só aceita raster — pulamos SVG).
  // Lê as dimensões reais para preservar a proporção (sem esticar).
  let logo: { dataUrl: string; w: number; h: number } | null = null;
  const logoPath = ws?.whitelabel_logo_url;
  if (logoPath && !logoPath.toLowerCase().endsWith(".svg")) {
    try {
      const { bytes, contentType } = await lerLogo(logoPath);
      const dim = dimensoesImagem(bytes);
      if (dim) {
        logo = {
          dataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
          w: dim.w,
          h: dim.h,
        };
      }
    } catch {
      logo = null;
    }
  }

  // Mesmo deck usado na tela/PDF (compõe uma vez, reusa do cache).
  const deck = await garantirDeck(params.id, comparativo.payload, empresa);

  const buffer = await gerarPptxComparativo(deck, {
    empresa,
    criadoEm: comparativo.created_at,
    propostas: comparativo.payload.propostas.map((p) => ({ ref: p.ref })),
    vencedorRef: comparativo.payload.vencedor_ref,
    cores: {
      fundo: ws?.whitelabel_cor_primaria,
      destaque: ws?.whitelabel_cor_secundaria,
    },
    logo,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${nomeArquivo(comparativo.titulo)}"`,
    },
  });
}
