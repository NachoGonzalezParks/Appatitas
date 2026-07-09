// Edge Function: booking-payment (Sprint 5 · HU-017)
//
// Integración con Mercado Pago Marketplace: creación de la preferencia de pago
// con split de comisión y manejo del webhook de confirmación. Scaffold de
// Sprint 0: sin lógica. Bloqueada por GAP-001/002/003/007.
// TODO(Sprint 5 · HU-017): implementar creación de pago + webhook.

Deno.serve((_req: Request) => {
  return new Response(
    JSON.stringify({ ok: true, scaffold: "booking-payment" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
