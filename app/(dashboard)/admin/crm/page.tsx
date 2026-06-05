import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ehEmailInterno } from "@/lib/auth/interno";
import {
  listarLeads,
  montarLinkTeste,
  mensagemWhatsappTeste,
} from "@/lib/admin/leads";
import { linkWhatsapp } from "@/lib/whatsapp";
import { formatarData } from "@/lib/format";
import { CrmNovoLeadForm } from "./CrmNovoLeadForm";
import { BotaoWhatsapp } from "./BotaoWhatsapp";
import { enviarConviteEmailAction, removerLeadAction } from "./actions";

export const metadata: Metadata = { title: "CRM — Vetly" };
export const dynamic = "force-dynamic";

function Selo({ lead }: { lead: { tem_conta: boolean; convidado_em: string | null } }) {
  const { texto, cor } = lead.tem_conta
    ? { texto: "Entrou", cor: "bg-lime-faint text-[#5C7A0E]" }
    : lead.convidado_em
      ? { texto: "Convidado", cor: "bg-[#E8E6DC] text-texto-2" }
      : { texto: "Novo", cor: "bg-paper-warm text-texto-3" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}>
      {texto}
    </span>
  );
}

export default async function CrmPage() {
  const session = await auth();
  if (!ehEmailInterno(session?.user?.email)) redirect("/painel");

  const leads = await listarLeads();
  // Pré-monta os links de convite no servidor (precisam de env e telefone).
  const itens = leads.map((l) => {
    const link = montarLinkTeste(l.email, l.nome);
    return {
      ...l,
      linkWa: l.telefone
        ? linkWhatsapp(l.telefone, mensagemWhatsappTeste(l.nome, link))
        : null,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-texto-3 hover:text-ink transition-colors"
        >
          ← Voltar ao Admin
        </Link>
        <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2">
          CRM de testes
        </h1>
        <p className="text-sm text-texto-2 mt-1">
          Cadastre um prospect e mande o convite de teste com a cara do Vetly —
          por e-mail ou WhatsApp. Cada um que entra ganha o teste grátis.
        </p>
      </div>

      {/* Novo lead */}
      <section className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-6">
        <h2 className="font-display font-bold text-ink text-lg mb-3">
          Novo lead
        </h2>
        <CrmNovoLeadForm />
      </section>

      {/* Lista de leads */}
      <section className="rounded-xl border border-[color:var(--border-subtle)] bg-white overflow-hidden">
        <h2 className="font-display font-bold text-ink text-lg px-6 pt-6 pb-3">
          Leads ({itens.length})
        </h2>
        {itens.length === 0 ? (
          <p className="text-sm text-texto-3 px-6 pb-6">
            Nenhum lead ainda. Cadastre o primeiro acima.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {itens.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-[color:var(--border-subtle)] align-top"
                >
                  <td className="px-6 py-3">
                    <span className="font-medium text-ink">{l.nome}</span>
                    <span className="block text-texto-3 text-xs">{l.email}</span>
                    {l.telefone && (
                      <span className="block text-texto-3 text-xs">
                        {l.telefone}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <Selo lead={l} />
                    {l.convidado_em && (
                      <span className="block text-texto-3 text-xs mt-1">
                        convidado em {formatarData(l.convidado_em)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <form action={enviarConviteEmailAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-[#5C7A0E] hover:underline"
                        >
                          Enviar e-mail
                        </button>
                      </form>
                      {l.linkWa && <BotaoWhatsapp href={l.linkWa} id={l.id} />}
                      <form action={removerLeadAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <button
                          type="submit"
                          className="text-sm text-texto-3 hover:text-danger transition-colors"
                        >
                          Remover
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
