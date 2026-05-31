import type { Metadata } from "next";
import { EmBreve } from "@/components/EmBreve";

export const metadata: Metadata = { title: "Financeiro — Vetly" };

export default function FinanceiroPage() {
  return (
    <EmBreve
      titulo="Financeiro"
      descricao="Faturas, pagamentos e seu plano. Chega junto com a cobrança (Stripe)."
    />
  );
}
