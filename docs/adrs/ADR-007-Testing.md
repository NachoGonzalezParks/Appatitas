# ADR-007: Estrategia de Testing (Vitest + Playwright)

**Fecha:** 2026-08-11
**Fuente:** RFC-004 (aprobado)

---

## Status

Aceptado

---

## Context

El proyecto no tenía testing automatizado: solo "pruebas a mano en staging" dispersas
en los planes de sprint y un paso "TEST" en el workflow, sin herramienta ni tests en
`package.json`. Con 3 desarrolladores tocando en paralelo áreas que se cruzan (Auth,
datos/RLS, UI, Edge Functions), la falta de una red de seguridad automatizada es un
riesgo de regresiones. Se necesita una base de tests alineada con el stack existente
(Vite + Vue 3 + TypeScript).

---

## Decision

Adoptar dos herramientas:

| Herramienta | Uso |
|---|---|
| **Vitest** | Tests **unitarios** (lógica pura y componentes Vue con `@vue/test-utils` + jsdom). Se integra nativamente con Vite. |
| **Playwright** | Tests **e2e** (flujos completos en un navegador real). |

**Estructura y scripts:**
- `tests/unit/**/*.spec.ts` (Vitest) · `tests/e2e/**/*.e2e.ts` (Playwright).
- `vitest.config.ts` y `playwright.config.ts` en la raíz.
- Scripts: `npm run test` (Vitest), `npm run test:watch`, `npm run test:e2e`.

**Definition of Done:** cada HU incorpora al menos **1 test** de su flujo principal
(unit y/o e2e) antes de mergear. No se busca cobertura exhaustiva, sino proteger los
caminos críticos.

**Reparto por rol:** Dev1 (RLS/RPC), Dev2 (componentes/flujos UI), Dev3 (utilidades e
integraciones con servicios externos, y dueño de la infraestructura de testing).

**CI:** diferido a una fase 2 (correr `test` + `test:e2e` en cada PR vía GitHub Actions);
primero se adopta el testing local.

---

## Consequences

**Positivas:**
- Red de seguridad contra regresiones; confianza para avanzar rápido con 3 devs en paralelo.
- Vitest reusa la config de Vite (mismo `resolve`, plugins), sin herramienta nueva de build.
- Playwright levanta la app sola (`webServer`) y no requiere infraestructura extra.

**Negativas / Restricciones:**
- Playwright descarga navegadores (`npx playwright install`) — paso único por máquina/CI.
- Los e2e son más lentos y frágiles que los unit: se usan pocos, sobre flujos estables.
- Overhead de mantener tests con el equipo trabajando en horas extra: se mitiga con el
  mínimo de 1 test por HU, no cobertura total.

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **Jest** | Requiere configuración y transformadores propios para Vite/ESM/Vue. Vitest se integra nativamente con Vite y comparte su config. |
| **Cypress** | Válido para e2e, pero Playwright tiene mejor soporte multi-navegador, ejecución paralela y `webServer` integrado, con menos fricción de setup. |
| **Solo pruebas manuales en staging** | Estado actual: no escala, no detecta regresiones automáticamente y depende de la memoria de cada dev. |
