import { NextResponse } from "next/server";
import { caminhoLogoWorkspace } from "@/lib/workspace/db";
import { lerLogo } from "@/lib/workspace/logo";

export const dynamic = "force-dynamic";

/** Serve o logo do whitelabel de um workspace (público — logo não é sigiloso). */
export async function GET(
  _req: Request,
  { params }: { params: { workspaceId: string } },
) {
  try {
    const caminho = await caminhoLogoWorkspace(params.workspaceId);
    if (!caminho) {
      return new NextResponse("Logo não encontrado", { status: 404 });
    }
    const { bytes, contentType } = await lerLogo(caminho);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Erro ao carregar logo", { status: 500 });
  }
}
