import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buscarProposta, buscarAnalise } from "@/lib/propostas/db";
import { garantirDeckProposta } from "@/lib/propostas/deck-plan";
import { buscarWorkspaceDoUsuario } from "@/lib/workspace/db";
import { lerLogo, dimensoesImagem } from "@/lib/workspace/logo";
import { gerarPptxComparativo } from "@/lib/comparativos/pptx";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/fornecedores/schema";

export const dynamic = "force-dynamic";

function nomeArquivo(titulo: string): string {
  const slug =
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "analise";
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

  const proposta = await buscarProposta(userId, params.id);
  if (!proposta) return new NextResponse("Não encontrado", { status: 404 });
  const analise = await buscarAnalise(userId, params.id);
  if (!analise) {
    return new NextResponse("Proposta ainda não foi analisada", { status: 409 });
  }

  const ws = await buscarWorkspaceDoUsuario(userId);
  const empresa = ws?.whitelabel_empresa_nome || ws?.nome || null;

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

  const deck = await garantirDeckProposta(params.id, analise, empresa);

  const buffer = await gerarPptxComparativo(deck, {
    empresa,
    criadoEm: proposta.created_at,
    eyebrow: "ANÁLISE DE PROPOSTA",
    subinfo: ROTULO_CATEGORIA[proposta.categoria as Categoria] ?? undefined,
    banda: { rotulo: "Fornecedor", valor: analise.fornecedor.nome },
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
      "Content-Disposition": `attachment; filename="${nomeArquivo(proposta.titulo)}"`,
    },
  });
}
