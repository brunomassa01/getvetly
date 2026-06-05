import "server-only";

interface EmailInput {
  para: string;
  assunto: string;
  html: string;
  texto?: string; // versão em texto puro (multipart). Se omitida, geramos do HTML.
}

/**
 * Gera uma versão em texto puro a partir do HTML (fallback simples).
 * E-mails sem parte de texto contam ponto contra a entrega (caem mais em spam),
 * então sempre enviamos texto + HTML.
 */
function htmlParaTexto(html: string): string {
  return html
    // mantém o endereço dos links: <a href="x">y</a> → "y (x)"
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|h\d|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // remove o resto das tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n") // colapsa linhas em branco demais
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Envia um e-mail transacional via Resend (sempre multipart: texto + HTML).
 * Se RESEND_API_KEY não estiver configurada (ex: antes de criar a conta),
 * cai num fallback de desenvolvimento que apenas registra o conteúdo no log
 * do servidor — útil para testar o fluxo de recuperação de senha sem e-mail.
 */
export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
}: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.RESEND_FROM_EMAIL ?? "nao-responda@getvetly.com";
  const responderPara = process.env.RESEND_REPLY_TO;
  const textoFinal = texto ?? htmlParaTexto(html);

  if (!apiKey) {
    console.warn(
      `[email:dev] (Resend não configurado) Para: ${para} | Assunto: ${assunto}\n${html}`,
    );
    return;
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: para,
      subject: assunto,
      html,
      text: textoFinal,
      ...(responderPara ? { reply_to: responderPara } : {}),
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Falha ao enviar e-mail (Resend ${resposta.status}): ${detalhe}`);
  }
}

// Escapa HTML para inserir texto do usuário (título, mensagem) com segurança.
function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Monta o e-mail que leva o link público de aprovação para o destinatário. */
export function emailCompartilhamento({
  link,
  empresa,
  titulo,
  mensagem,
}: {
  link: string;
  empresa: string | null;
  titulo: string;
  mensagem?: string;
}): { assunto: string; html: string } {
  const de = escaparHtml(empresa ?? "Vetly");
  const tituloSeguro = escaparHtml(titulo);
  const msg = mensagem ? escaparHtml(mensagem) : null;
  return {
    assunto: `${de} compartilhou uma análise para sua aprovação`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E1E1E;">
        <h2 style="color: #1E1E1E;">Análise para aprovação</h2>
        <p><strong>${de}</strong> compartilhou <strong>${tituloSeguro}</strong> para você revisar e dar seu parecer.</p>
        ${
          msg
            ? `<p style="background:#FAFAF7;border-left:3px solid #C8FF02;padding:10px 14px;color:#444;">${msg}</p>`
            : ""
        }
        <p>Veja o relatório completo e aprove ou recuse direto pelo link — sem precisar criar conta.</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #C8FF02; color: #1E1E1E; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            Ver e aprovar
          </a>
        </p>
        <p style="color: #85827A; font-size: 13px;">O link expira em 15 dias.</p>
      </div>
    `,
  };
}

/** Monta o e-mail de convite para entrar no workspace de uma empresa. */
export function emailConvite({
  link,
  empresa,
  convidadoPor,
}: {
  link: string;
  empresa: string;
  convidadoPor: string | null;
}): { assunto: string; html: string } {
  const de = escaparHtml(empresa);
  const quem = convidadoPor ? escaparHtml(convidadoPor) : null;
  return {
    assunto: `Você foi convidado para ${de} na Vetly`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E1E1E;">
        <h2 style="color: #1E1E1E;">Convite para a equipe</h2>
        <p>${quem ? `<strong>${quem}</strong> convidou você` : "Você foi convidado"} para usar a Vetly na conta de <strong>${de}</strong> — analisar propostas comerciais com IA.</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #C8FF02; color: #1E1E1E; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            Aceitar convite
          </a>
        </p>
        <p style="color: #85827A; font-size: 13px;">O convite expira em 7 dias.</p>
      </div>
    `,
  };
}

/**
 * Monta o e-mail de convite para um lead testar a ferramenta (mini-CRM).
 * Leva ao cadastro, onde a pessoa cria a conta e ganha o teste grátis.
 */
export function emailConviteTeste({
  nome,
  link,
  analisesGratis,
}: {
  nome: string;
  link: string;
  analisesGratis: number;
}): { assunto: string; html: string } {
  const oi = escaparHtml(nome.split(" ")[0] || nome);
  return {
    assunto: "Seu convite para testar a Vetly",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E1E1E;">
        <h2 style="color: #1E1E1E;">Olá, ${oi}! 👋</h2>
        <p>Quero te mostrar a <strong>Vetly</strong> — uma ferramenta que analisa propostas comerciais com inteligência artificial em segundos, apontando preços, riscos e o melhor fornecedor pra você.</p>
        <p>Preparei um acesso de teste com <strong>${analisesGratis} análises grátis</strong>, sem cartão. É só criar sua conta pelo botão abaixo:</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #C8FF02; color: #1E1E1E; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            Começar meu teste grátis
          </a>
        </p>
        <p style="color: #85827A; font-size: 13px;">Qualquer dúvida, é só responder este e-mail.</p>
      </div>
    `,
  };
}

/** Monta o e-mail de recuperação de senha. */
export function emailRecuperacaoSenha(link: string): {
  assunto: string;
  html: string;
} {
  return {
    assunto: "Redefinição de senha — Vetly",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E1E1E;">
        <h2 style="color: #1E1E1E;">Redefinir sua senha</h2>
        <p>Recebemos um pedido para redefinir a senha da sua conta na Vetly.</p>
        <p>Clique no botão abaixo. O link expira em 1 hora.</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #C8FF02; color: #1E1E1E; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="color: #85827A; font-size: 13px;">Se você não pediu isso, pode ignorar este e-mail com segurança.</p>
      </div>
    `,
  };
}
