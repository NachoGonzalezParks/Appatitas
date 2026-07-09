// Edge Function: found-pet-match (Sprint 3 · HU-014)
//
// Se dispara al reportar una mascota encontrada: busca coincidencias contra
// reportes abiertos (especie + color + ST_DWithin 3 KM) y avisa a los Tutores.
// Scaffold de Sprint 0: sin lógica.
// TODO(Sprint 3 · HU-014): implementar motor de coincidencias.

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ ok: true, scaffold: "found-pet-match" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
