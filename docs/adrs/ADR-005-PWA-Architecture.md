# ADR-005: Progressive Web App (PWA) como Arquitectura de Frontend
**Fecha:** Mayo 2025
**Fuente:** `docs/SDD_MASTER.md` v1.1

---

## Status

Aceptado

---

## Context

El sistema necesita una interfaz de usuario que cumpla los siguientes requisitos derivados del SDD:

- **Acceso multiplataforma:** Los actores son Tutores, Proveedores y Ciudadanos que usan dispositivos móviles y de escritorio. El SDD no restringe el dispositivo de acceso.
- **Notificaciones push:** HU-009 (alertas de salud) y HU-012 (mascota perdida) requieren Web Push API, disponible en navegadores modernos sin necesidad de instalación desde una app store.
- **Geolocalización nativa:** HU-013 y HU-016 usan la API de geolocalización del navegador para obtener coordenadas actuales del usuario.
- **Mapas interactivos:** HU-013 (mapa comunitario) y HU-016 (búsqueda de Proveedores) requieren mapas con pines interactivos.
- **Acceso público sin sesión:** HU-013 y HU-014 son módulos accesibles sin login, lo que favorece una arquitectura web sin barreras de instalación.
- **Almacenamiento de archivos:** Los usuarios suben fotos (HU-003, HU-006) y adjuntos clínicos (HU-010) directamente desde el dispositivo.
- **Equipo y plazos:** 3 desarrolladores, 4 meses para Fase 1. Una sola base de código para todos los dispositivos es preferible a mantener apps nativas separadas.

---

## Decision

Adoptar **Progressive Web App (PWA)** como arquitectura de frontend única, desplegada como aplicación web accesible desde navegador móvil y de escritorio.

**Capacidades PWA aprovechadas según el SDD:**

| Capacidad PWA | Uso en APPATITAS | HU |
|---|---|---|
| Web Push API | Alertas de salud y mascota perdida | HU-009, HU-012 |
| Geolocation API | Coordenadas actuales del usuario | HU-013, HU-016 |
| File input / Camera API | Subida de fotos y adjuntos | HU-003, HU-006, HU-010, HU-012, HU-014 |
| Instalable (manifest + Service Worker) | Acceso desde pantalla de inicio sin app store | — |
| Acceso offline parcial (Service Worker) | No especificado en SDD, capacidad disponible | — |

**Sin app nativa (iOS/Android):** El SDD no especifica ninguna funcionalidad que requiera APIs nativas no disponibles en navegadores modernos. La PWA cubre todos los casos de uso documentados.

---

## Consequences

**Positivas:**
- Una única base de código cubre iOS, Android y escritorio, reduciendo el esfuerzo de desarrollo y mantenimiento para 3 desarrolladores.
- No requiere proceso de aprobación en App Store ni Google Play para publicar actualizaciones. Las actualizaciones se despliegan directamente vía web.
- El mapa comunitario (HU-013) y el formulario de mascota encontrada (HU-014) son accesibles públicamente sin que el ciudadano deba instalar nada.
- Web Push API disponible en navegadores modernos tanto en Android como en iOS (desde iOS 16.4 con limitaciones).

**Negativas / Restricciones:**
- **iOS Push Notifications:** Web Push en iOS requiere que el usuario haya agregado la PWA a su pantalla de inicio (A2HS). Usuarios que no realicen este paso no recibirán las alertas de HU-009 y HU-012 en iPhone.
- Las PWA tienen acceso limitado a algunas APIs del sistema en iOS comparadas con apps nativas, aunque ninguna funcionalidad del SDD requiere esas APIs.
- El rendimiento de mapas interactivos (HU-013, HU-016) en dispositivos de gama baja puede verse afectado según la librería de mapas elegida (no especificada en el SDD).

---

## Alternatives Considered

| Alternativa | Motivo de descarte |
|---|---|
| **App nativa iOS + Android (React Native / Flutter)** | Duplica o fragmenta el esfuerzo de desarrollo. Para 3 desarrolladores en 4 meses, mantener dos bases de código nativas no es viable. Requiere aprobación en App Stores para cada actualización. |
| **App nativa separada por plataforma (Swift + Kotlin)** | Triplica el esfuerzo. Inviable para el equipo y los plazos del SDD. |
| **Web app sin capacidades PWA (sin Service Worker ni manifest)** | Perdería Web Push API, necesaria para HU-009 y HU-012. La instalabilidad desde pantalla de inicio también mejoraría la retención en Fase 1. |
