# Plan de Desbloqueo — APPATITAS

**Objetivo:** seguir avanzando al máximo mientras están sin definir el **nombre** y el **dominio**, y mientras faltan decisiones de negocio de Sprint 5. La idea: **diferir lo trabado con "cáscaras" (stubs)** para que nada frene el resto.

> **Leyenda:** 🗣️ = explicación simple · 🔧 = detalle técnico.
> 🗣️ Si algo está trabado por un tema externo, lo dejamos "de adorno" (un botón que dice "Próximamente") y seguimos con todo lo demás. No paramos la obra porque falta una puerta.

## 0. Principios para destrabar

| Traba | Cómo la salteamos |
|---|---|
| **Nombre sin definir** | 🗣️ Usamos "APPATITAS" como nombre provisorio en todos lados y lo cambiamos de una cuando se decida. 🔧 Placeholder en `manifest`, emails y UI; swap con buscar/reemplazar. **Solo Meta necesita el nombre real** para registrar la app. |
| **Dominio sin comprar** | 🗣️ Para probar los mails de registro **no hace falta** el dominio todavía. 🔧 En desarrollo usamos el **email nativo de Supabase** (SMTP propio con límite). Resend (dominio propio) queda para más adelante. |
| **Facebook login** | 🗣️ Botón "Ingresar con Facebook — Próximamente" **deshabilitado**. 🔧 Stub + *feature flag* (`VITE_ENABLE_FACEBOOK=false`); se activa cuando haya nombre+dominio+revisión de Meta. **Se documenta la postergación** para no perderla. |
| **Gaps de Sprint 5** | 🗣️ Son decisiones de negocio, no código → se empiezan a definir **ya**, en paralelo (ver §5). |

---

## 1. Cerrar Sprint 0

**Ya hecho:** proyecto Supabase + esquema (16+ migraciones, RLS, índices), Auth email + **Google** funcionando, **4 buckets** con políticas, scaffold PWA + Service Worker, utilitaria Resend + Edge Functions (cáscaras), Web Push (SW + claves VAPID).

**Para darlo por cerrado falta:**

| Ítem | Quién | Nota |
|---|---|---|
| Mergear los PRs abiertos de dev3 | Equipo (revisión) | Housekeeping |
| **Facebook OAuth → stub documentado** (postergado) | Ale (dev3) | No bloquea |
| **Resend/SMTP → postergado** hasta dominio | Ale (dev3) | En dev, email nativo de Supabase |
| Test users de Google (Trini/Nacho) | Ale (dev3) | Menor |

> Decisión a registrar: **cerramos Sprint 0 con Facebook y Resend postergados** (documentados como "diferidos"), no como incompletos.

---

## 2. Sprint 1 — Identidad y Perfiles *(está 100% destrabado)*

**HU-001 a 004.** Es lo más importante para arrancar: sin usuarios ni mascotas no hay nada arriba.

| Dev | Qué le toca |
|---|---|
| **Nacho (dev2)** | Registro/Login (email + Google reales + **Facebook stub**), verificación de email, Perfil de Tutor, CRUD de Mascota (alta/edición/baja). *Es el grueso visible.* |
| **Trini (dev1)** | Trigger Auth→`users`, RLS fina de `users`/`pets`, RPC de baja lógica de mascota (HU-004). |
| **Ale (dev3)** | Verificar que llegue el mail de verificación (con el email nativo de Supabase); dejar el **stub de Facebook**. Poco: Sprint 1 es sobre todo de Nacho y Trini. |

---

## 3. Sprint 2 — Pasaporte de Salud

**HU-007 a 011.**

| Dev | Qué le toca |
|---|---|
| **Nacho (dev2)** | Pantallas de vacunas, desparasitaciones, historial clínico, alertas, y el pasaporte compartido. |
| **Trini (dev1)** | RLS de `health_records` y `passport_shares`, RPC de *snooze* (posponer alerta +7 días), hash con pgcrypto. |
| **Ale (dev3)** | **Edge Function del cron de alertas** (`health-alerts-cron`), envío por email (Resend/Supabase), **registro de la suscripción push** en la PWA, y pruebas de Web Push en Android/iOS. Acá se enciende todo lo que quedó armado en Sprint 0. |

---

## 4. Sprint 3 — Comunidad y Mascotas Perdidas

**HU-012 a 015.**

| Dev | Qué le toca |
|---|---|
| **Nacho (dev2)** | Formulario de mascota perdida/encontrada, mapa comunitario, detalle del reporte. |
| **Trini (dev1)** | RLS de `lost_reports`, tabla `feed_events`. |
| **Ale (dev3)** | **3 Edge Functions:** aviso masivo a 5 km (perdida), motor de coincidencias a 3 km (encontrada), y cierre de reporte. |

---

## 5. Sprints 4 y 5 — Proveedores y Marketplace *(parcialmente trabados)*

- **Sprint 4 (proveedores):** avanzable. Nacho: pantallas de alta/galería/horarios; Trini: RLS providers; **Ale (dev3): onboarding de Mercado Pago (OAuth)** — se puede **preparar en sandbox ya**, no necesita CUIT ni dominio.
- **Sprint 5 (pagos):** 🔴 **bloqueado por 4 decisiones de negocio** (GAP-001 criterios de reserva, GAP-002 % de comisión, GAP-003 cuándo se libera la plata, GAP-007 estados de la reserva) + la cuenta real de Mercado Pago.
  > **Acción clave del equipo:** empezar a **definir esos 4 puntos con la Product Owner/Comercial ya**, aunque falten sprints. No es código; es la decisión que más cuesta y la que más traba el negocio.

---

## 6. Agregado nuevo: Testing *(hoy no existe en el proyecto)*

Hoy solo hay "pruebas a mano en staging". Proponemos **testing automatizado**. Primero, qué es cada cosa:

- 🗣️ **Vite** = la herramienta que **ya usamos** para construir la app (no es de testing; aclaración porque a veces se confunde).
- 🗣️ **Vitest** = el corredor de **tests unitarios**, que se integra con Vite. Prueba **piezas aisladas** (ej: "¿la función que calcula la próxima desparasitación da la fecha correcta?"). 🔧 Rápido, corre en Node, ideal para lógica pura.
- 🗣️ **Playwright** = herramienta de **tests e2e**. 🔧 Automatiza un navegador real.
- 🗣️ **"e2e" (end-to-end = de punta a punta)** = prueba el **flujo completo como un usuario real**: abre la app, hace clic en "Registrarme", llena el formulario, y verifica que la cuenta se creó. A diferencia del unitario (que prueba una función sola), el e2e prueba **todo el camino junto**.

**Qué testear (propuesta):**

| Tipo | Ejemplos |
|---|---|
| **Unit (Vitest)** | `sendEmail`, parseo del payload de push, cálculo de `next_due_date`, validaciones de formularios |
| **e2e (Playwright)** | Registro → verificación → login; cargar una mascota; ver el pasaporte; reportar mascota perdida |

**Cómo se incorpora:**

- Sumar `vitest` y `@playwright/test` al proyecto + scripts (`npm run test`, `npm run test:e2e`).
- Que cada HU tenga, en su "Definition of Done", **al menos un test** del flujo principal.
- Como es infraestructura (no una feature de negocio), lo formalizamos con un **RFC corto** + un doc de estrategia + actualizar el `dev-guide`.
- **Dueño:** Ale (dev3) — es tooling/infra, y no depende del nombre ni del dominio.

---

## 7. Acciones inmediatas (resumen)

1. **Nacho:** arranca **Sprint 1 UI** (lo más destrabado y visible).
2. **Trini + Product Owner:** empiezan a **resolver los 4 gaps de Sprint 5** (decisiones).
3. **Ale (dev3):** monta el **testing** (Vitest + Playwright) y deja el **stub de Facebook**.
4. **Equipo:** registrar la decisión de **cerrar Sprint 0 con Facebook/Resend diferidos**.
