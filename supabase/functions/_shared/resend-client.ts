// Utilidad de envío de email vía Resend (Sprint 0 · S0-07).
//
// Especificación (docs/sprint-0-plan.md §2.6): recibe (to, subject, html) y
// devuelve { success, error }. La usarán HU-001 (email de verificación) y
// HU-009 (alertas de salud).
//
// Implementada contra la API REST de Resend con `fetch` para evitar dependencias
// extra en el runtime Deno de las Edge Functions.

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  /** Remitente opcional. Por defecto usa RESEND_FROM del entorno. */
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Envía un email transaccional a través de Resend.
 * Nunca lanza: siempre devuelve { success, error } para que el llamador decida.
 */
export async function sendEmail(
  { to, subject, html, from }: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY no está configurada" };
  }

  const sender = from ?? Deno.env.get("RESEND_FROM") ??
    "APPATITAS <no-reply@appatitas.app>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: sender, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { success: false, error: `Resend respondió ${res.status}: ${detail}` };
    }

    const data = await res.json();
    return { success: true, id: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
