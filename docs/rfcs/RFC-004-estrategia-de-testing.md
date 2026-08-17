# RFC-004: Estrategia de Testing (Vitest + Playwright)

**Autor:** Alejandro González (aegonzalez73) — dev3
**Fecha:** 2026-08-09
**Estado:** Propuesto — pendiente de aprobación del equipo
**Nivel de aprobación requerido:** Todo el equipo (agrega tecnología + cambia el "Definition of Done" — SDD_LOCK §4.1, "Cambio de proveedor tecnológico")

---

## Motivación

El proyecto **no tiene testing automatizado**. Hoy solo existen "pruebas a mano en
staging" dispersas en los planes de sprint y un paso "TEST" en el workflow, pero sin
herramienta: `package.json` no incluye ningún framework de tests.

Esto es un riesgo creciente: somos **3 devs tocando en paralelo áreas que se cruzan**
(Auth, datos/RLS, UI, Edge Functions). Sin una red de seguridad automatizada, un cambio
puede romper un flujo que ya funcionaba y nadie se entera hasta staging o producción.
Una base de tests da confianza para avanzar rápido sin miedo a regresiones.

---

## Cambio propuesto

Adoptar dos herramientas, alineadas con el stack actual (Vite + Vue + TypeScript):

- **Vitest** — tests **unitarios** (lógica pura y componentes). Se integra nativamente con Vite.
- **Playwright** — tests **e2e** (end-to-end): flujos completos simulando un usuario real en el navegador.

### Herramientas y scripts

- `devDependencies`: `vitest`, `@vue/test-utils`, `@playwright/test`.
- Scripts en `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"test:e2e": "playwright test"`

### Estructura de carpetas

```
tests/
├── unit/            # Vitest — *.spec.ts (lógica y componentes)
└── e2e/             # Playwright — *.e2e.ts (flujos completos)
vitest.config.ts     # (o config dentro de vite.config.ts)
playwright.config.ts
```

### Qué se testea (mínimos)

| Tipo | Ejemplos |
|---|---|
| **Unit (Vitest)** | `sendEmail`, parseo del payload de push del Service Worker, cálculo de `next_due_date` (desparasitación), validaciones de formularios |
| **e2e (Playwright)** | Registro → verificación → login; alta de mascota; ver pasaporte; reportar mascota perdida |

### Definition of Done (nuevo criterio)

Cada HU incorpora **al menos 1 test** de su flujo principal (unit y/o e2e según
corresponda) antes de mergear a `sprint/N`. No se busca cobertura exhaustiva, sino
proteger los caminos críticos.

### Reparto por rol (para no chocar con los dominios de cada uno)

- **Dev1 (Trini):** tests de RLS/RPC (unit de lógica; e2e de aislamiento de acceso).
- **Dev2 (Nacho):** tests de componentes y flujos de UI (Vitest + Playwright).
- **Dev3 (Ale):** tests unit de utilidades (`sendEmail`, payload push) y e2e de flujos que tocan servicios externos (con mocks / sandbox). **Ale es dueño de la infraestructura de testing** (setup, configs, guía).

### CI (fase 2, opcional)

Correr `test` + `test:e2e` en cada PR vía GitHub Actions. Se puede **diferir**: primero
adoptar el testing local; el CI se suma después sin bloquear.

---

## HU afectadas

Ninguna en su **definición funcional**. Es un cambio transversal: agrega cobertura de
tests a todas las HU sin alterar su alcance.

---

## Documentos a actualizar

- **Nuevo `ADR-007-Testing.md`** (decisión de arquitectura de testing).
- `docs/dev-guide.md` — sección de testing + el nuevo criterio de "Definition of Done".
- `docs/SDD_LOCK.md` §2.4 — sumar la decisión tecnológica (Testing: Vitest + Playwright).
- `package.json` — scripts y `devDependencies`.

---

## Tablas afectadas

Ninguna.

---

## Reglas de negocio afectadas

Ninguna.

---

## Riesgos

- **Curva de aprendizaje de Playwright.** Mitigación: empezar con pocos e2e de flujos
  críticos y sumar de a poco; el grueso de la cobertura va en tests unit (más simples).
- **e2e lentos o frágiles.** Mitigación: pocos, sobre flujos estables; no abusar del e2e.
- **e2e que tocan Supabase / servicios externos.** Mitigación: correr contra **staging**
  o con mocks/sandbox; **nunca contra producción**.
- **Overhead percibido** (los 3 devs trabajan en horas extra). Mitigación: el mínimo es
  **1 test por HU**, no cobertura total; el testing debe acelerar, no frenar.

---

## ADR requerido

**Sí.** Al aprobarse este RFC se crea **ADR-007: Estrategia de Testing**, documentando la
elección de **Vitest + Playwright** y las alternativas descartadas (p. ej. Jest, Cypress)
con su justificación.
