// Plantilla base de email transaccional (Sprint 0 · S0-07).
//
// Genera el HTML común (encabezado + cuerpo + botón opcional + pie) que reutilizan
// los emails del sistema: verificación de cuenta (HU-001) y alertas de salud (HU-009).
//
// Uso:
//   import { baseEmail } from "../_shared/email-template.ts";
//   import { sendEmail } from "../_shared/resend-client.ts";
//
//   await sendEmail({
//     to: usuario.email,
//     subject: "Verificá tu cuenta",
//     html: baseEmail({
//       heading: "¡Bienvenido a APPATITAS!",
//       bodyHtml: "<p>Confirmá tu email para empezar a usar la app.</p>",
//       cta: { label: "Verificar mi email", url: verificationUrl },
//       preheader: "Confirmá tu email para activar tu cuenta",
//     }),
//   });
//
// Nota: HTML pensado para clientes de email (layout con tablas + estilos inline),
// no para navegador. El `bodyHtml` es contenido de confianza generado por nosotros.

// TODO(marca): reemplazar por los colores/logo de marca definitivos cuando se definan.
const ACCENT = "#2E7D6B";
const TEXT = "#1F2933";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const BG = "#F4F5F7";
const APP_NAME = "APPATITAS";

export interface EmailButton {
  label: string;
  url: string;
}

export interface BaseEmailOptions {
  /** Encabezado principal del email. */
  heading: string;
  /** Cuerpo en HTML simple (párrafos `<p>`, listas, etc.). Contenido de confianza. */
  bodyHtml: string;
  /** Botón de acción opcional (ej. "Verificar mi email"). */
  cta?: EmailButton;
  /** Texto de previsualización que muestran algunas bandejas de entrada. */
  preheader?: string;
}

/** Devuelve el HTML completo del email listo para enviar con `sendEmail`. */
export function baseEmail(
  { heading, bodyHtml, cta, preheader }: BaseEmailOptions,
): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
    : "";

  const ctaHtml = cta
    ? `
      <tr>
        <td style="padding:8px 0 4px 0;">
          <a href="${cta.url}"
             style="display:inline-block;background:${ACCENT};color:#ffffff;
                    text-decoration:none;font-weight:600;font-size:15px;
                    padding:12px 22px;border-radius:8px;">
            ${cta.label}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};
                      border-radius:12px;overflow:hidden;
                      font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <!-- Encabezado -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid ${BORDER};">
              <span style="font-size:18px;font-weight:700;color:${ACCENT};letter-spacing:0.5px;">
                ${APP_NAME}
              </span>
            </td>
          </tr>
          <!-- Cuerpo -->
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px 0;font-size:20px;line-height:1.3;color:${TEXT};">
                ${heading}
              </h1>
              <div style="font-size:15px;line-height:1.6;color:${TEXT};">
                ${bodyHtml}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                ${ctaHtml}
              </table>
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="padding:18px 28px;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">
                Este email fue enviado por ${APP_NAME}. Si no reconocés esta actividad,
                podés ignorar este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
