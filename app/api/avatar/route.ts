import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buscarPerfil } from "@/lib/auth/usuarios";
import { lerLogo } from "@/lib/workspace/logo";

export const dynamic = "force-dynamic";

/** Serve a foto de perfil do usuário logado (arquivo no disco ou URL OAuth). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const perfil = await buscarPerfil(session.user.id);
  const url = perfil?.avatar_url;
  if (!url) return new NextResponse("Sem foto", { status: 404 });

  // Foto do Google (OAuth) é uma URL externa — redireciona.
  if (url.startsWith("http")) return NextResponse.redirect(url);

  try {
    const { bytes, contentType } = await lerLogo(url);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Sem foto", { status: 404 });
  }
}
