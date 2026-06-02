import Link from "next/link";

interface Plano {
  nome: string;
  preco: string;
  periodo?: string;
  resumo: string;
  itens: string[];
  destaque?: boolean;
  cta: string;
  href: string;
}

const PLANOS: Plano[] = [
  {
    nome: "Starter",
    preco: "R$ 297",
    periodo: "/mês",
    resumo: "Para começar a profissionalizar suas análises.",
    itens: ["1 a 2 usuários", "~20 análises/mês", "Comparação e apresentação", "Sua marca (whitelabel)"],
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    nome: "Pro",
    preco: "R$ 897",
    periodo: "/mês",
    resumo: "Para times que analisam propostas toda semana.",
    itens: ["Até 5 usuários", "~80 análises/mês", "Tudo do Starter", "Aprovação por link"],
    destaque: true,
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    nome: "Business",
    preco: "R$ 2.490",
    periodo: "/mês",
    resumo: "Para áreas de compras com volume.",
    itens: ["Até 15 usuários", "~250 análises/mês", "Tudo do Pro", "Suporte prioritário"],
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    nome: "Enterprise",
    preco: "Sob consulta",
    resumo: "Volume alto, SSO e necessidades específicas.",
    itens: ["Usuários ilimitados", "Volume sob medida", "SSO e whitelabel avançado", "Suporte dedicado"],
    cta: "Falar com vendas",
    href: "mailto:contato@getvetly.com",
  },
];

function CardPlano({ plano }: { plano: Plano }) {
  return (
    <div
      className={`flex flex-col rounded-2xl p-7 ${
        plano.destaque
          ? "bg-ink text-paper shadow-lg ring-2 ring-lime"
          : "bg-paper border border-[color:var(--border-subtle)]"
      }`}
    >
      {plano.destaque && (
        <span className="self-start font-mono text-[10px] tracking-wide2 uppercase bg-lime text-ink rounded-full px-2.5 py-1 mb-4">
          Mais popular
        </span>
      )}
      <h3 className="font-display font-extrabold text-xl tracking-tight">
        {plano.nome}
      </h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display font-extrabold text-3xl tracking-tighter">
          {plano.preco}
        </span>
        {plano.periodo && (
          <span className={plano.destaque ? "text-paper/60 text-sm" : "text-texto-3 text-sm"}>
            {plano.periodo}
          </span>
        )}
      </div>
      <p className={`mt-3 text-sm ${plano.destaque ? "text-paper/80" : "text-texto-2"}`}>
        {plano.resumo}
      </p>

      <ul className="mt-6 space-y-2.5 flex-1">
        {plano.itens.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <span className={plano.destaque ? "text-lime" : "text-lime-deep"}>✓</span>
            <span className={plano.destaque ? "text-paper/90" : "text-texto-2"}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={plano.href}
        className={`mt-7 text-center font-body font-semibold text-sm px-5 py-2.5 rounded-md transition-colors ${
          plano.destaque
            ? "bg-lime text-ink hover:bg-lime-deep"
            : "bg-ink text-paper hover:opacity-90"
        }`}
      >
        {plano.cta}
      </Link>
    </div>
  );
}

export function Planos() {
  return (
    <section id="planos" className="w-full max-w-6xl mx-auto px-6 py-20 sm:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <span className="font-mono text-[11px] tracking-wide3 uppercase text-texto-3">
          Planos
        </span>
        <h2 className="mt-3 font-display font-extrabold text-ink text-3xl sm:text-4xl tracking-tighter">
          Comece grátis. Assine quando crescer.
        </h2>
        <p className="mt-3 text-texto-2 leading-relaxed">
          Suas primeiras análises são por nossa conta, sem cartão. Passou da
          cota do plano? Compre créditos avulsos ou suba de plano.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANOS.map((p) => (
          <CardPlano key={p.nome} plano={p} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-texto-3">
        Preços em reais (BRL). Valores e cotas podem ser ajustados antes do
        lançamento oficial.
      </p>
    </section>
  );
}
