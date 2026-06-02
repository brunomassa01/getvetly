// E-mails internos (Bruno/equipe/demo de vendas) = vitalícios: não passam por
// cobrança nem por limite de assentos. Lista no .env `INTERNAL_ADMIN_EMAILS`
// (separada por vírgula). Ex.: brunobrm@gmail.com,demo@getvetly.com

export function ehEmailInterno(email: string | null | undefined): boolean {
  if (!email) return false;
  const lista = (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}
