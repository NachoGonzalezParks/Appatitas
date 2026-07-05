# Rol Dev 1 — Infraestructura y Datos

**Responsable:** _(a completar por el equipo)_
**Foco:** Los cimientos invisibles de la app — dónde y cómo se guarda cada dato, y que esos datos estén seguros.

> Resumen en una frase: *Dev 1 construye y protege la base de datos; nadie ve su trabajo directamente, pero sin él nada se guarda ni queda seguro.*
> Reparto del equipo: dev1 = Base de datos y seguridad · dev2 = Pantallas (UI) · dev3 = Integraciones y servicios externos.
>
> _Ficha derivada de `docs/dev-guide.md` (sección "Roles del Equipo"). Sujeta a validación del propio Dev 1._

---

## Responsabilidades (todo el proyecto)

### 1. La estructura de la base de datos
- **No técnico:** Definir "dónde y cómo se guarda cada cosa" — los usuarios, las mascotas, las reservas. Es el arquitecto de los cajones donde vive toda la información.
- **Técnico:** Todas las migraciones de Supabase (`supabase/migrations/*.sql`), en el orden estricto de dependencias (las 14 tablas del esquema).

### 2. La seguridad de los datos
- **No técnico:** Que cada usuario vea **solo lo suyo** y nadie pueda espiar los datos de otro (fichas de salud, teléfonos, etc.).
- **Técnico:** Políticas de **Row Level Security (RLS)** por tabla, y la revisión final de seguridad al cierre de cada sprint.

### 3. Las búsquedas por cercanía (rendimiento)
- **No técnico:** Que buscar "mascotas perdidas cerca" o "veterinarias cerca" sea **rápido**, aunque haya muchísimos datos.
- **Técnico:** PostGIS, índice GIST sobre `locations.coordinates`, y revisión de performance de las consultas `ST_DWithin`.

### 4. El puente ordenado entre la app y los datos
- **No técnico:** La "capa" que le sirve los datos a las pantallas de forma prolija, sin que cada pantalla tenga que pelearse con la base.
- **Técnico:** Los *stores* (estado global) que encapsulan las consultas complejas a la base.

### 5. Guardián de la seguridad del equipo
- **No técnico:** Antes de cerrar cada etapa, revisa que nada quede expuesto por error.
- **Técnico:** Revisión final de RLS y seguridad en cada sprint; mantiene `docs/architecture/security.md`.

---

## Archivos que "siempre son míos"

- `supabase/migrations/*.sql` — las migraciones (esquema de la base).
- `supabase/config.toml` — configuración de Supabase.
- `src/stores/*.store.ts` — la lógica de datos del frontend.
- `docs/architecture/database.md` y `docs/architecture/security.md` — la documentación del esquema y la seguridad.
