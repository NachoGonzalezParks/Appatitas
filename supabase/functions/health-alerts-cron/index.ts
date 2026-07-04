// Edge Function: health-alerts-cron (Sprint 2 · HU-009)
//
// Cron diario que evalúa `health_records` (vencimientos a 30/7/0 días) y envía
// alertas por email (Resend) y push (Web Push). Scaffold de Sprint 0: sin lógica.
// TODO(Sprint 2 · HU-009): implementar consulta + envío. Ver docs/sprint-2-plan.md.

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ ok: true, scaffold: "health-alerts-cron" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
