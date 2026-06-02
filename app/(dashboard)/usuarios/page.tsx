import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import {
  ehAdmin,
  listarMembros,
  listarConvitesPendentes,
  infoAssentos,
} from "@/lib/workspace/membros";
import { formatarData } from "@/lib/format";
import { ConvidarForm } from "@/components/usuarios/ConvidarForm";
import {
  removerMembroAction,
  revogarConviteAction,
} from "./actions";

export const metadata: Metadata = { title: "Usuários — Vetly" };
export const dynamic = "force-dynamic";

const ROTULO_PAPEL: Record<string, string> = {
  admin: "Administrador",
  member: "Operador",
};

export default async function UsuariosPage() {
  const userId = await usuarioAtual();
  if (!(await ehAdmin(userId))) redirect("/painel");

  const [membros, convites, assentos] = await Promise.all([
    listarMembros(userId),
    listarConvitesPendentes(userId),
    infoAssentos(userId),
  ]);

  const ilimitado = !Number.isFinite(assentos.limite) || assentos.limite >= 9999;
  const podeConvidar = assentos.usados < assentos.limite;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
          Usuários
        </h1>
        <p className="text-sm text-texto-2 mt-1">
          Convide sua equipe. Administradores gerenciam empresa, usuários e
          plano; operadores usam o sistema.
        </p>
      </div>

      {/* Uso de assentos */}
      <section className="bg-white border border-[color:var(--border-subtle)] rounded-lg p-5">
        <p className="text-sm text-texto-3">Usuários no plano</p>
        <p className="font-display font-bold text-ink text-xl mt-0.5">
          {assentos.usados} {ilimitado ? "" : `de ${assentos.limite}`}
          <span className="text-sm font-body font-normal text-texto-2">
            {ilimitado ? " · ilimitado" : " usados"}
          </span>
        </p>
      </section>

      {/* Convidar */}
      <section>
        <h2 className="font-display font-bold text-lg text-ink mb-3">
          Convidar usuário
        </h2>
        <ConvidarForm podeConvidar={podeConvidar} />
      </section>

      {/* Membros */}
      <section>
        <h2 className="font-display font-bold text-lg text-ink mb-3">
          Equipe ({membros.length})
        </h2>
        <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <tbody>
              {membros.map((m) => (
                <tr
                  key={m.id}
                  className="border-t first:border-t-0 border-[color:var(--border-subtle)]"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">
                      {m.nome ?? m.email}
                    </span>
                    {m.user_id === userId && (
                      <span className="text-texto-3"> (você)</span>
                    )}
                    <span className="block text-texto-3 text-xs">{m.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E8E6DC] text-texto-2">
                      {ROTULO_PAPEL[m.role] ?? m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.user_id !== userId && (
                      <form action={removerMembroAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="text-sm text-texto-3 hover:text-danger transition-colors"
                        >
                          Remover
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Convites pendentes */}
      {convites.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">
            Convites pendentes ({convites.length})
          </h2>
          <div className="border border-[color:var(--border-subtle)] rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <tbody>
                {convites.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t first:border-t-0 border-[color:var(--border-subtle)]"
                  >
                    <td className="px-4 py-3">
                      <span className="text-ink">{c.email}</span>
                      <span className="block text-texto-3 text-xs">
                        {ROTULO_PAPEL[c.role] ?? c.role} · enviado em{" "}
                        {formatarData(c.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={revogarConviteAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="text-sm text-texto-3 hover:text-danger transition-colors"
                        >
                          Revogar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
