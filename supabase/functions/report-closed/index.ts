// Edge Function: report-closed (Sprint 3 · HU-015)
//
// Se dispara al cerrar un reporte de pérdida con éxito (status = found):
// registra el evento en la tabla de feed de zona. Scaffold de Sprint 0: sin lógica.
// TODO(Sprint 3 · HU-015): implementar el INSERT del evento de cierre.

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ ok: true, scaffold: "report-closed" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
