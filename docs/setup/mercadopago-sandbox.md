# Setup — Mercado Pago (Sandbox)

**Responsable:** dev3 (Integraciones · Pagos)
**Tarea:** prep de Sprints 4-5 (onboarding de proveedor · HU-005, y reserva/pago · HU-017).
**Referencia:** ADR-004 (Mercado Pago Marketplace como gateway).

> **Qué es "sandbox":** un entorno de **prueba** con plata ficticia. Se simulan pagos completos
> sin cobrar de verdad y **sin necesitar CUIT ni dominio**. Ideal para desarrollar y probar
> Sprint 4/5 mientras se define la figura fiscal para producción.
>
> Los nombres de botones del panel de Mercado Pago cambian seguido; si alguno difiere, buscá el equivalente.

---

## FASE 0 — Cuenta

- [X] Tener/crear una cuenta de **Mercado Pago**. Para sandbox alcanza una cuenta común (sin CUIT).
- [X] **[Decisión de equipo]** Idealmente la cuenta va a nombre **del proyecto**, no personal
  (igual que Meta/Google). Para empezar a probar, una personal sirve.

## FASE 1 — Crear la aplicación

- [X] Entrar a **developers.mercadopago.com** → **"Tus integraciones"** → **Crear aplicación**.
- [X] Nombre: `APPATITAS` (provisorio). Producto: **Pagos / Checkout** (para el marketplace se usa
  el modelo con *split* de comisión, que se configura en Sprint 5).

## FASE 2 — Credenciales y modo de prueba (según el producto)

> ⚠️ **Con Checkout Pro NO se "activan credenciales de prueba".** Ese botón (y las
> "Credenciales de prueba" con prefijo `TEST-...`) es solo para **Checkout API / Bricks**;
> en Checkout Pro intentar activarlas **da error** (`DXT40`). En **Checkout Pro** (el que usa
> APPATITAS, ADR-004 + `sprint-5-plan`) la prueba se hace con **cuentas de prueba** (Fase 3)
> \+ **tarjetas de prueba** (Fase 4). **No cambies de producto** solo por ese botón.

- [ ] **Credenciales de la app** (se usan al implementar, Sprint 5): **Public Key**, **Access
  Token** y **Client ID / Client Secret** están en **Configuración de la aplicación →
  Credenciales**. El **Access Token es secreto** (solo servidor / Edge Functions).

## FASE 3 — Usuarios de prueba

- [ ] En la app → **Cuentas de prueba** → crear **2**:
  - Un **comprador** (simula al Tutor que paga).
  - Un **vendedor** (simula al Proveedor que cobra).
- [ ] Guardar usuario y contraseña de cada uno (se usan para simular transacciones).

## FASE 4 — Tarjetas de prueba

- [ ] Anotar las **tarjetas de prueba** que da Mercado Pago (Visa/Mastercard de test) para simular
  pagos **aprobados** y **rechazados**. (Están en la doc de MP; no son tarjetas reales.)

---

## Qué datos guardar (y dónde van)

| Dato | Dónde |
|---|---|
| Public Key (TEST) | `.env` cliente (no secreta) |
| Access Token (TEST) | Secreto → Edge Functions (nunca al repo) |
| Client ID / Client Secret | Gestor seguro (para Sprint 4, OAuth Marketplace) |
| Usuarios de prueba (comprador/vendedor) | Gestor de contraseñas |

## ⚠️ Cuidados

- **Sandbox ≠ producción:** las credenciales `TEST-...` no mueven plata real. Perfecto para desarrollar.
- El **Access Token es secreto** (nunca al repo; va a los *secrets* de las Edge Functions).
- En producción entra la **figura fiscal** (monotributo/SAS — ver `docs/`/notas del equipo) y las
  credenciales reales.

## Estado

- **Diferido de producción:** cuenta real + CUIT/figura fiscal quedan para cuando se implemente el
  cobro real (Sprint 5). Esta guía cubre solo el **sandbox** para desarrollar sin bloqueos.
