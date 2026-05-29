import "server-only";

interface EmailInput {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Envia um e-mail transacional via Resend.
 * Se RESEND_API_KEY não estiver configurada (ex: antes de criar a conta),
 * cai num fallback de desenvolvimento que apenas registra o conteúdo no log
 * do servidor — útil para testar o fluxo de recuperação de senha sem e-mail.
 */
export async function enviarEmail({
  para,
  assunto,
  html,
}: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.RESEND_FROM_EMAIL ?? "nao-responda@getvetly.com";

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
    body: JSON.stringify({ from: remetente, to: para, subject: assunto, html }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Falha ao enviar e-mail (Resend ${resposta.status}): ${detalhe}`);
  }
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
