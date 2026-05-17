/**
 * Account-link confirmation email template.
 *
 * Sent when a Google OAuth token arrives for an email that already has a verified
 * LOCAL account. The user must click the link to confirm merging their Google identity.
 *
 * Plain HTML string function — no framework. See design §10.5 for tradeoff rationale.
 *
 * Spec refs: F4.9
 * Design refs: Section 4.5 (Templates)
 *
 * IMPORTANT: The linkUrl contains the raw ACCOUNT_LINK token.
 * This function MUST NOT log params — logging is the adapter's responsibility (F4.5).
 *
 * Design notes:
 * - Brand palette mirrors frontend/app/app.css (--color-primary-* gold tones).
 * - Table-based layout for maximum email-client compatibility.
 * - Includes a plain-text `text` body to reduce spam scores.
 */
export interface LinkAccountParams {
  name: string;
  linkUrl: string;
  googleEmail: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function linkAccountTemplate({ name, linkUrl, googleEmail }: LinkAccountParams): EmailTemplate {
  const safeName = escapeHtml(name);
  const safeGoogleEmail = escapeHtml(googleEmail);
  const year = new Date().getFullYear();

  const text = [
    `Hola, ${name}.`,
    "",
    `Detectamos un intento de ingreso con Google usando la cuenta: ${googleEmail}.`,
    "",
    "Esa dirección de email ya está asociada a una cuenta existente en Estudio Glow.",
    "Si querés vincular tu cuenta de Google, ingresá al siguiente enlace:",
    "",
    linkUrl,
    "",
    "Este enlace es válido por 10 minutos.",
    "Si no iniciaste esta acción, ignorá este mensaje — tu cuenta está segura.",
    "",
    `© ${year} Estudio Glow`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Vinculá tu cuenta — Estudio Glow</title>
</head>
<body style="margin:0;padding:0;background-color:#faf7ef;font-family:Georgia,'Times New Roman',serif;color:#3a2f10;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf7ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e6c8;">
          <tr>
            <td style="background:linear-gradient(135deg,#fad257 0%,#c7a433 60%,#ad8e2b 100%);height:6px;line-height:6px;font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 40px 24px 40px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:bold;letter-spacing:4px;color:#7b641b;text-transform:uppercase;">
                Estudio Glow
              </div>
              <div style="margin-top:6px;font-size:12px;letter-spacing:3px;color:#ad8e2b;text-transform:uppercase;">
                Centro de estética
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:#3a2f10;">
                Hola, ${safeName}.
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#555;">
                Detectamos un intento de ingreso con Google usando la cuenta:
              </p>
              <div style="background-color:#fdf6dc;border-left:3px solid #c7a433;padding:12px 18px;border-radius:4px;margin-bottom:20px;">
                <strong style="color:#3a2f10;font-size:15px;">${safeGoogleEmail}</strong>
              </div>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#555;">
                Esa dirección ya está asociada a una cuenta existente en
                <strong style="color:#3a2f10;">Estudio Glow</strong>.
                Si querés vincular tu cuenta de Google, confirmá la acción:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:6px;background-color:#c7a433;">
                    <a href="${linkUrl}"
                       style="display:inline-block;padding:14px 32px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
                      Vincular cuenta de Google
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#888;text-align:center;">
                Este enlace es válido por <strong style="color:#7b641b;">10 minutos</strong>.
                Si no iniciaste esta acción, ignorá este mensaje — tu cuenta está segura.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <div style="border-top:1px solid #f0e6c8;padding-top:20px;font-size:12px;color:#a39669;line-height:1.6;">
                <p style="margin:0 0 8px 0;">
                  ¿El botón no funciona? Copiá y pegá esta dirección en tu navegador:
                </p>
                <p style="margin:0;word-break:break-all;">
                  <a href="${linkUrl}" style="color:#ad8e2b;text-decoration:underline;">${linkUrl}</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf7ef;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a39669;letter-spacing:1px;">
                © ${year} ESTUDIO GLOW · TODOS LOS DERECHOS RESERVADOS
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: "Confirmá la vinculación de tu cuenta — Estudio Glow",
    html,
    text,
  };
}

/** Minimal HTML escaping for user-controlled strings inserted into templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
