# Guía de Testing — APPATITAS

**Para:** los 3 devs. **Qué es esto:** cómo correr, escribir y decidir tests en el proyecto. El "por qué" de la decisión (elección de herramientas) está en `docs/adrs/ADR-007-Testing.md`.

## 1. Qué es cada herramienta (sin tecnicismos)

- **Vitest** = revisa **piezas sueltas** de código. Le hacés una pregunta puntual a una función ("si le paso esto, ¿devuelve lo correcto?") y te contesta al instante. Rápido, sin navegador.
- **Playwright** = revisa la app **como un usuario real**: abre un navegador solo, hace clic, llena formularios y verifica que pasó lo esperado.
- **"unit" vs "e2e":** *unit* prueba una parte aislada (una función, un componente); *e2e* ("de punta a punta") prueba el **recorrido completo** (ej: registrarse → verificar → entrar). Los unit son muchos y rápidos; los e2e, pocos y sobre los flujos importantes.

## 2. Qué ya está listo en el proyecto

- Herramientas instaladas y configuradas (`vitest.config.ts`, `playwright.config.ts`).
- Comandos listos en `package.json`.
- **3 tests de ejemplo** que sirven de plantilla:
  - `tests/unit/features.spec.ts` → lógica pura.
  - `tests/unit/login-page.spec.ts` → componente Vue (con el router mockeado).
  - `tests/e2e/smoke.e2e.ts` → flujo en navegador.

## 3. Cómo correrlos

```bash
git pull            # traer el setup
npm install         # ⚠️ importante: instala las dependencias nuevas
npm run test        # tests unitarios (deberías ver 3 en verde)
npm run test:watch  # unitarios en modo "vigilar" (re-corre al guardar)
```

Para los e2e (una sola vez por máquina, descarga el navegador):
```bash
npx playwright install chromium
npm run test:e2e
```

## 4. Cómo escribir un test

Dos caminos:
1. **Rápido:** copiar el ejemplo que más se parezca y adaptarlo.
2. **Recomendado:** **pedírselo a tu IA** (Claude Code o la que uses). La IA escribe el test, vos revisás.

### Qué pedirle a tu IA (prompts listos para copiar)

> ⭐ **Truco:** antes de pedirle, mostrale (o abrile) **el archivo que querés testear** y **uno de los ejemplos de `tests/`** como referencia de estilo. El resultado mejora mucho.

**Test unitario de una función:**
```
Escribí un test unitario con Vitest para la función <nombre> del archivo <ruta>.
Seguí el estilo de tests/unit/features.spec.ts. Cubrí estos casos: <listá los casos>.
```

**Test de un componente Vue:**
```
Escribí un test de componente con Vitest y @vue/test-utils para <Componente.vue>.
Verificá <qué debería renderizar/hacer>. Si usa vue-router, mockealo como en
tests/unit/login-page.spec.ts.
```

**Test e2e de un flujo:**
```
Escribí un test e2e con Playwright del flujo: <describí los pasos>. Seguí el estilo de
tests/e2e/smoke.e2e.ts. La app corre en http://localhost:5173.
```

### Ejemplo resuelto (de punta a punta)

Supongamos la función que calcula la próxima desparasitación — regla RN-010: *próxima fecha = fecha de aplicación + días de frecuencia*.

**1. Lo que le pedís a tu IA:**
```
Escribí un test unitario con Vitest para la función proximaDesparasitacion(fechaAplicacion, frecuenciaDias)
del archivo src/bc03-health/lib/deworming.ts. Devuelve la fecha de la próxima dosis
(fechaAplicacion + frecuenciaDias). Seguí el estilo de tests/unit/features.spec.ts.
Cubrí: una frecuencia de 30 días, y que no modifique la fecha original.
```

**2. Lo que la IA te devuelve** (`tests/unit/deworming.spec.ts`):
```ts
import { describe, expect, it } from 'vitest'
import { proximaDesparasitacion } from '@/bc03-health/lib/deworming'

describe('proximaDesparasitacion', () => {
  it('suma la frecuencia en días a la fecha de aplicación', () => {
    const aplicada = new Date('2026-03-01')
    const proxima = proximaDesparasitacion(aplicada, 30)
    expect(proxima.toISOString().slice(0, 10)).toBe('2026-03-31')
  })

  it('no modifica la fecha original', () => {
    const aplicada = new Date('2026-03-01')
    proximaDesparasitacion(aplicada, 30)
    expect(aplicada.toISOString().slice(0, 10)).toBe('2026-03-01')
  })
})
```

**3. Lo corrés y verificás:**
```bash
npm run test
```
Deberías ver los dos casos en verde (✓). Si alguno falla, se ajusta hasta que pase.

> Fijate el patrón: cada `it(...)` es **un caso** ("qué debería pasar") y `expect(...).toBe(...)` es la **verificación**. Un buen test también prueba lo que *no* debería pasar (acá, que no se rompa la fecha original).

## 5. Qué probar en cada sprint (derivarlo de las especificaciones)

No adivines qué testear: **sacalo del SDD**. Cada pieza del corpus te da casos:
- **Cada criterio de aceptación de una HU** → un caso de test.
- **Cada regla de negocio (RN)** → algo verificable (ej. RN-011: frecuencias válidas 15/30/60/90/180 → probar que **rechaza** otras).
- **Los gaps y zonas delicadas** (concurrencia, RLS, límites) → lo más propenso a errores.

**No todo se automatiza.** Hay cosas que conviene probar **a mano** (exploratorio): que un mail *realmente* llegue, que el push aparezca en un celular real, que el pago en sandbox se comporte, la UX, distintos navegadores. Ahí aparecen bugs que Vitest y Playwright no ven.

### Pedile a tu IA el plan de test del sprint
```
En base a la HU-XXX (y sus criterios de aceptación) y las reglas de negocio asociadas (RN-...),
sugerime qué conviene probar. Separá en: (a) tests automatizados —cuáles con Vitest y cuáles
con Playwright— y (b) verificaciones manuales/exploratorias difíciles de automatizar.
Para cada uno, decime qué caso cubre.
```

### Ejemplo (HU-001 · Registro de Tutor)
Lo que la IA podría sugerir:
- **Vitest (unit):** email inválido rechazado; password mínimo; que el rol elegido se mapee bien (`tutor`/`provider`).
- **Playwright (e2e):** registro con email → aparece "verificá tu email"; login con Google (test user) → entra; sin verificar, una ruta privada redirige a `/login`.
- **Manual / exploratorio:** que el mail de verificación **llegue** (revisar spam); que el enlace de verificación funcione; probar en 2 navegadores; qué pasa si el email ya existe (RN-005).

## 6. Regla del equipo (Definition of Done)

Cada HU incorpora **al menos 1 test** de su flujo principal antes de mergear. No buscamos cubrir todo, sino proteger los caminos críticos.

## 7. Qué le toca a cada uno

- **Trini (dev1):** tests de RLS/RPC (que cada usuario vea solo lo suyo; que las funciones de base den el resultado correcto).
- **Nacho (dev2):** tests de componentes y flujos de UI (pantallas, formularios).
- **Ale (dev3):** tests de utilidades e integraciones con servicios externos.
