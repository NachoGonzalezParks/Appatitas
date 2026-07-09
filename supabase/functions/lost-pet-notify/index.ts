// Edge Function: lost-pet-notify (Sprint 3 · HU-012)
//
// Se dispara al publicar un reporte de mascota perdida: notifica por push a los
// usuarios en un radio de 5 KM (ST_DWithin). Scaffold de Sprint 0: sin lógica.
// TODO(Sprint 3 · HU-012): implementar consulta geoespacial + push masivo.

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ ok: true, scaffold: "lost-pet-notify" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
