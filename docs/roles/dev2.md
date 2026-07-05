# Rol Dev 2 — Producto y Experiencia de Usuario

**Responsable:** _(a completar por el equipo)_
**Foco:** Todo lo que el usuario ve y toca — las pantallas, los formularios y que el recorrido se sienta claro y natural.

> Resumen en una frase: *Dev 2 construye la cara visible de la app; es lo único que el usuario final realmente ve.*
> Reparto del equipo: dev1 = Base de datos y seguridad · dev2 = Pantallas (UI) · dev3 = Integraciones y servicios externos.
>
> _Ficha derivada de `docs/dev-guide.md` (sección "Roles del Equipo"). Sujeta a validación del propio Dev 2._

---

## Responsabilidades (todo el proyecto)

### 1. Las pantallas
- **No técnico:** Cada pantalla de la app: registrarse, cargar una mascota, ver el pasaporte de salud, buscar un servicio. Es lo que el usuario ve.
- **Técnico:** Todas las páginas (`*Page.vue`) por historia de usuario (HU), organizadas por Bounded Context (`src/bc*/pages/`).

### 2. Las piezas reutilizables
- **No técnico:** Los "ladrillos" que se repiten en muchas pantallas: tarjetas, formularios, botones, ventanas de confirmación.
- **Técnico:** Componentes reutilizables (`*Card.vue`, `*Form.vue`, uploaders, modales) en `src/bc*/components/` y `src/shared/`.

### 3. Los recorridos del usuario
- **No técnico:** Que el paso a paso (registrarse → verificar email → completar perfil → cargar mascota) sea claro y fiel a lo diseñado, sin que el usuario se pierda.
- **Técnico:** Traducir los flujos del SDD a la UI; navegación entre pantallas (`router/index.ts`) y sus guardas (`guards.ts`).

### 4. Conectar la pantalla con los datos
- **No técnico:** Que los botones y formularios efectivamente **traigan y guarden** la información (que "Guardar" guarde de verdad).
- **Técnico:** Integración de los servicios TypeScript (cliente de Supabase) en la UI (`src/bc*/services/*.ts`).

---

## Archivos que "siempre son míos"

- `src/bc*/pages/*.vue` — las pantallas por HU.
- `src/bc*/components/*.vue` y `src/shared/components/*.vue` — los componentes reutilizables.
- `src/router/index.ts` y `src/router/guards.ts` — la navegación y sus protecciones.
- `src/bc*/services/*.ts` — la conexión de la UI con el cliente de Supabase.
