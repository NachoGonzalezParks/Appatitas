# Guía de Contribución — APPATITAS

Este documento define el **modelo de trabajo conjunto** del equipo de 3 desarrolladores: dónde vive cada cosa, cómo se aplican los cambios y cómo se coordina el trabajo. Surge de la revisión pre-Sprint 0 (`docs/reviews/revision-plan-sprint-0.md`, sección 2).

> Para la **división de tareas por sprint y rol**, ver `docs/dev-guide.md`.
> Para el **proceso de cambio del corpus normativo (RFC)**, ver `docs/SDD_LOCK.md` §4.
> La fuente de verdad del producto es `docs/SDD_MASTER.md`.

---

## 1. Dónde vive cada cosa

| Activo | Dónde vive | Versionado en Git |
|---|---|---|
| **Código de la PWA** | Repositorio GitHub (`src/`) | Sí |
| **Esquema de base de datos** | Migraciones SQL en `supabase/migrations/` | Sí (esquema como código) |
| **Datos de la base** | Nube de Supabase (proyectos staging y producción) | No |
| **Archivos de usuarios (Storage)** | Buckets de Supabase cloud | No |
| **Edge Functions** | `supabase/functions/` | Sí |
| **Secretos** (`.env.staging`, `.env.production`) | Local de cada dev + gestor de secretos del equipo | No (en `.gitignore`) |
| **Plantilla de variables** | `.env.example` | Sí |
| **Documentación normativa** | `docs/` | Sí |

**Principio:** la base de datos **no vive en el repo**. El repo guarda el *esquema como código* (migraciones). La base corre en la nube de Supabase. Esto significa que aplicar una migración es un acto deliberado, no un efecto de `git pull`.

---

## 2. Entornos

Tres niveles, de menor a mayor criticidad:

1. **Local por desarrollador** — cada dev corre Supabase localmente con la **Supabase CLI** (Docker). Es el entorno donde se desarrolla y se prueban migraciones sin afectar a nadie.
2. **Staging** — un único proyecto Supabase compartido. Es el entorno de **integración**: aquí convergen los carriles de los 3 devs y se valida el sprint antes de cerrarlo.
3. **Producción** — proyecto Supabase separado. Nunca se desarrolla ni se prueba aquí.

**Regla:** desarrollá contra tu Supabase local. Usá staging solo para integrar. Nunca apuntes tu entorno de desarrollo a producción.

### Arranque del entorno local

```bash
# Requisitos: Docker, Node, Supabase CLI
supabase start                # levanta Postgres + Auth + Storage locales
supabase db reset             # aplica todas las migraciones desde cero
cp .env.example .env.local    # completar con las claves locales que imprime `supabase start`
```

---

## 3. Migraciones

- **Una migración por cambio**, nunca en lote. Nombre numerado y descriptivo: `0013_create_push_subscriptions.sql`.
- **Nunca modificar una migración ya aplicada en staging.** Si hay que corregir algo, crear una nueva migración.
- El orden importa: respetar las dependencias de foreign key (ver `docs/sprint-0-plan.md` §2.2).
- Las migraciones se aplican a staging/producción **desde la rama principal**, no desde ramas de feature. El responsable de Datos (Dev 1) coordina la aplicación.

```bash
supabase migration new nombre_descriptivo   # crea el archivo
# ... editar el .sql ...
supabase db reset                            # probar localmente
supabase db push                             # aplicar a staging (desde main, coordinado)
```

---

## 4. Estrategia de ramas y Pull Requests

```
main          → estable; refleja lo aplicado en staging
feature/SXXX  → rama por tarea (ej: feature/S1-01)
```

Flujo:

1. Crear `feature/SXXX` desde `main`.
2. Desarrollar y probar localmente (incluidas migraciones).
3. Abrir PR hacia `main`. El PR referencia la tarea (`Closes S1-01`).
4. **Mínimo una revisión** de otro dev antes de mergear.
5. Tras el merge, Dev 1 (Datos) aplica las migraciones nuevas a staging.

**Requisitos del PR:**
- Si toca el esquema de BD → incluir la migración.
- Si toca un documento normativo de `docs/` → referenciar el RFC aprobado (ver SDD_LOCK §4).
- No mezclar cambios de esquema con cambios de UI no relacionados en el mismo PR.

---

## 5. Secretos

Los archivos `.env.staging` y `.env.production` están en `.gitignore` y **nunca** se commitean. Solo se versiona `.env.example` como plantilla.

- **Dueño del proyecto Supabase:** el Dev Lead administra los proyectos staging y producción y es responsable de las claves maestras (`SERVICE_ROLE_KEY`).
- **Distribución de claves:** las claves se comparten por un canal seguro acordado por el equipo (gestor de secretos / 1Password / bóveda), **nunca** por chat, email ni en el repo.
- **Variables requeridas:** ver `.env.example` y `docs/sprint-0-plan.md` §2.1 (incluye `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

---

## 6. Coordinación entre carriles

El equipo trabaja en 3 carriles por rol (Dev 1 Datos · Dev 2 Frontend · Dev 3 Plataforma — ver `docs/dev-guide.md`). Puntos de coordinación recurrentes:

- **Contrato de tablas:** cuando el trigger de Auth (Dev 3) llena una tabla que crea Dev 1, ambos acuerdan las columnas antes de implementar.
- **Tipos generados:** Dev 1 genera `supabase.types.ts` tras cada cambio de esquema; Dev 2 los consume. No editar ese archivo a mano.
- **Dependencias de servicios externos:** Dev 3 inicia los procesos lentos (revisión de Meta para Facebook OAuth, verificación DNS de Resend, aprobación de Mercado Pago) lo antes posible, porque no son codificables y pueden tardar días.

---

## 7. Antes de codificar (recordatorio del SDD)

Por las reglas de `.claude/CLAUDE.md` y `docs/SDD_LOCK.md`:

1. Toda tarea corresponde a una HU listada en SDD_LOCK §2.1.
2. Las tablas afectadas están en SDD_LOCK §2.2 (14 tablas tras RFC-001/002/003).
3. La tecnología usada está autorizada en SDD_LOCK §2.4.
4. Si falta información o aparece un gap → **detenerse** y elevar (RFC si toca el corpus). No asumir reglas de negocio.
