// Helpers para abrir o WhatsApp com uma mensagem pronta (link wa.me).
// Não envia nada automaticamente: o link abre o WhatsApp do próprio usuário
// (você), que clica em "enviar". Zero integração, zero custo. Uma integração
// com a API oficial do WhatsApp Business ficaria para depois (exigiria ADR).

/**
 * Deixa o telefone só com dígitos e garante o DDI do Brasil (55).
 * Aceita formatos como "(11) 99999-9999", "11999999999" ou "+55 11 99999-9999".
 * Assume Brasil quando o número não começa com 55.
 */
export function normalizarTelefoneBr(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return "";
  return digitos.startsWith("55") ? digitos : `55${digitos}`;
}

/**
 * Monta um link wa.me com a mensagem já preenchida.
 * @example linkWhatsapp("11999999999", "Oi!") → "https://wa.me/5511999999999?text=Oi%21"
 */
export function linkWhatsapp(telefone: string, mensagem: string): string {
  const numero = normalizarTelefoneBr(telefone);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
