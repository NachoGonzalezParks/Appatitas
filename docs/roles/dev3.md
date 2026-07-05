# Rol Dev 3 — Integraciones y Servicios Externos

**Quién:** Alejandro González (GitHub: aegonzalez73)
**Foco:** El puente entre la app y todo lo que vive *afuera* de ella — emails, pagos, notificaciones y login con cuentas externas.

> Resumen en una frase: *si la app necesita hablar con un servicio externo, es área de dev3.*
> Reparto del equipo: dev1 = Base de datos y seguridad · dev2 = Pantallas (UI) · dev3 = Integraciones y servicios externos.

---

## Responsabilidades (todo el proyecto)

### 1. Emails automáticos del sistema
- **No técnico:** Que la app pueda mandar mails sola — el de "confirmá tu cuenta" al registrarse y los recordatorios ("a tu perro le vence una vacuna").
- **Técnico:** Integración con **Resend**: verificación de dominio (SPF/DKIM/DMARC), función utilitaria `sendEmail()`, y conexión como SMTP de Supabase Auth. HU-001, HU-009.

### 2. Notificaciones push (avisos al celular)
- **No técnico:** Los carteles que aparecen en el teléfono aunque la app esté cerrada: "se perdió una mascota cerca tuyo", "tenés una vacuna por vencer".
- **Técnico:** **Web Push API**: claves VAPID, suscripción desde la PWA, almacenamiento (tabla `push_subscriptions`, RFC-001) y envío desde Edge Functions. HU-009/012/014.

### 3. La app "instalable" (PWA base)
- **No técnico:** Lograr que la web se pueda *instalar* en el teléfono como una app de la tienda, y que tenga la base para recibir notificaciones.
- **Técnico:** `public/manifest.json` (instalación A2HS) y `public/service-worker.js` (caché del shell + receptor de push). Scaffold en S0-05.

### 4. Inicio de sesión con Google/Facebook
- **No técnico:** Que la gente pueda entrar con su cuenta de Google o Facebook, sin inventar otra contraseña.
- **Técnico:** Proveedores **OAuth 2.0** en Supabase Auth (Google + Facebook, incluida la revisión de Meta) y email/contraseña con verificación. S0-04 y Sprint 1.

### 5. Pagos (Mercado Pago)
- **No técnico:** Todo lo de cobrar: que el dueño pague la reserva, que la plataforma se quede con su comisión y que el resto le llegue al prestador.
- **Técnico:** Integración **Mercado Pago Marketplace**: onboarding del proveedor (OAuth, `mp_user_id`), preferencia de pago con *split* de comisión, webhook de confirmación (verificación de firma) y expiración de pagos pendientes. Sprints 4-5, HU-017.

### 6. Las "automatizaciones" del servidor
- **No técnico:** Tareas que la app hace sola en segundo plano: revisar cada día qué vacunas vencen, avisar a los vecinos cuando se pierde una mascota, o reaccionar cuando se aprueba un pago.
- **Técnico:** **Edge Functions (Deno)**: `health-alerts-cron`, `lost-pet-notify`, `found-pet-match`, `report-closed`, `mp-payment-webhook`, `booking-expiry-cron`. Crons + triggers + webhooks.

### 7. Probar que todo lo externo funciona
- **No técnico:** Antes de que lo use gente real, verificar que los mails llegan, las notificaciones aparecen y los pagos se procesan de verdad — en un entorno de prueba.
- **Técnico:** Tests de integración end-to-end en **staging** contra Resend, Web Push (Android e iOS/A2HS) y el *sandbox* de Mercado Pago.

---

## Archivos que "siempre son míos"

- `supabase/functions/*` — las Edge Functions (automatizaciones, webhooks).
- `public/service-worker.js` y `public/manifest.json` — la PWA.
- Variables de entorno de servicios externos (Resend, Mercado Pago, VAPID).

---

## Procesos externos con demora (iniciar lo antes posible)

| Proceso | Por qué temprano | Para |
|---|---|---|
| Revisión de la app de Facebook (Meta) | La aprobación tarda días | S0-04 (Facebook OAuth) |
| Verificación de dominio en Resend (DNS) | El DNS puede tardar hasta 48 h | S0-07 (emails) |
| Alta de cuenta Mercado Pago Marketplace | El alta/aprobación tarda | Sprint 5 (pagos) |
