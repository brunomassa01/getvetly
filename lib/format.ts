/** Formata um valor numérico (string do Postgres ou number) como BRL. */
export function formatarMoeda(valor: string | number | null): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata uma data ISO como dd/mm/aaaa. */
export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * Código curto e estável a partir do id (uuid), para o usuário identificar/
 * referenciar uma proposta — ex: "#A1B2C3". Não exige coluna no banco.
 */
export function codigoCurto(id: string): string {
  return "#" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

/** Formata um tamanho em bytes para KB/MB legível. */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
