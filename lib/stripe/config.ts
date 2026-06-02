// Configuração dos planos do Stripe. Os Price IDs vivem no .env (mudam entre
// Test e Live), então aqui só mapeamos plano → nome da variável de ambiente.

export const PLANOS = ["starter", "pro", "business", "enterprise"] as const;
export type Plano = (typeof PLANOS)[number];

interface PlanoConfig {
  nome: string;
  preco: string;
  envPrice: string; // variável no .env com o price_... (mensal)
}

export const PLANOS_STRIPE: Record<Plano, PlanoConfig> = {
  starter: { nome: "Starter", preco: "R$ 297/mês", envPrice: "STRIPE_PRICE_STARTER_MENSAL" },
  pro: { nome: "Pro", preco: "R$ 897/mês", envPrice: "STRIPE_PRICE_PRO_MENSAL" },
  business: { nome: "Business", preco: "R$ 2.490/mês", envPrice: "STRIPE_PRICE_BUSINESS_MENSAL" },
  enterprise: { nome: "Enterprise", preco: "Sob consulta", envPrice: "STRIPE_PRICE_ENTERPRISE_MENSAL" },
};

/** Price ID (price_...) do plano, lido do ambiente. undefined se não configurado. */
export function priceIdDoPlano(plano: Plano): string | undefined {
  return process.env[PLANOS_STRIPE[plano].envPrice];
}

/** Plano correspondente a um price_... (usado no webhook). null se não bater. */
export function planoDoPriceId(priceId: string): Plano | null {
  for (const plano of PLANOS) {
    if (process.env[PLANOS_STRIPE[plano].envPrice] === priceId) return plano;
  }
  return null;
}

// Análises grátis no teste (sem cartão) antes de exigir assinatura.
export const ANALISES_GRATIS = 3;
