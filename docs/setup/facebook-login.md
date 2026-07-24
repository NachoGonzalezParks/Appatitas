# Setup — Facebook Login (Meta) con Supabase Auth

**Responsable:** dev3 (Integraciones)
**Estado:** en preparación (bloqueado parcialmente por dominio y proyecto Supabase)
**Fuentes verificadas:** [Supabase — Login with Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook) · [Meta — App Review](https://developers.facebook.com/docs/apps/review)

> Los nombres exactos de botones en el panel de Meta cambian seguido. Los pasos y el orden
> son correctos; si un botón se llama distinto, buscá el equivalente.

Leyenda: **[HOY]** = se puede hacer ya · **[BLOQUEADO]** = espera dominio o proyecto Supabase.

---

## FASE 0 — Preparación (decisiones previas)

- [ ] **[Decisión de equipo]** A nombre de quién va la cuenta de Meta → idealmente un **Business Portfolio del proyecto** (ver `docs/setup/facebook-login.md` sección "Sobre el Business Portfolio" más abajo).
- [ ] Tener a mano: nombre de la app (**visible a usuarios**, que represente a APPATITAS), email de contacto, ícono cuadrado 1024×1024 px.

### Sobre el Business Portfolio (a nombre de quién va la cuenta)

- Un **Business Portfolio** (antes "Business Manager", en business.facebook.com) es una **cuenta contenedora** que agrupa y es dueña de los activos del negocio: apps, Páginas, cuentas publicitarias, y administra las **personas y sus roles**. Es independiente de tu perfil personal.
- Para entrar/crear un Business Portfolio **igual iniciás sesión con un perfil personal de Facebook** (Meta no tiene logins de empresa separados del perfil personal). O sea: usás tu Facebook personal como *puerta de entrada*, pero la app la posee el **Portfolio del proyecto**, con los 3 devs agregados con roles.
- **Recomendado:** crear un Business Portfolio **nuevo y dedicado a APPATITAS**, agregar a los 3 devs como administradores, y usar la **entidad legal del proyecto** para la Business Verification (se conecta con la decisión fiscal monotributo vs SAS).
- **No** desarrollar la app de APPATITAS dentro del Portfolio de otro proyecto (ej. uno de marketing). Mantenerlos separados.
- Usar un **perfil personal existente y en buen estado** como administrador es preferible a crear una cuenta de Facebook nueva solo para esto (las cuentas nuevas reciben más escrutinio anti-abuso de Meta).

---

## FASE 1 — Crear cuenta y app · [HOY]

1. Entrar a **developers.facebook.com** con la cuenta del proyecto.
2. Registrarse como desarrollador: verificar identidad (teléfono + email).
3. **My Apps → Create App**.
4. Elegir el caso de uso **"Authenticate and request data from users with Facebook Login"**.
5. Completar **nombre de la app** y **email de contacto**. Si ofrece asociarla a un **Business Portfolio**, hacerlo.
6. **Create app** (pide la contraseña de Facebook).

## FASE 2 — Agregar el producto "Facebook Login" · [HOY]

7. En el panel de la app → **Add Product** → **Facebook Login → Set up**.
8. Elegir plataforma **"Web"** (la PWA cuenta como web).
9. Pedirá una **Site URL** → poner algo provisional (ej. `https://localhost`) y corregir con el dominio después.

## FASE 3 — Permiso de email (crítico para Supabase) · [HOY]

10. **Use Cases → "Authentication and Account Creation" → Edit**.
11. Verificar que estén **`public_profile`** y **`email`**, ambos en **"Ready for testing"**.
12. Si falta `email`, tocar **Add**. *(Sin email, el login con Supabase falla.)*

## FASE 4 — Copiar credenciales · [HOY]

13. **Settings → Basic**. Copiar **App ID**.
14. En **App Secret**, tocar **Show** y copiar.
15. Guardar ambos en un **gestor de contraseñas seguro. NUNCA en el repo ni en chats.** Luego van como secrets en Supabase.

## FASE 5 — Settings → Basic

16. **[HOY]** Cargar: App Icon (1024×1024), Category, Contact email.
17. **[BLOQUEADO — dominio]**: App Domains, **Privacy Policy URL** (obligatoria), Terms of Service URL, **User Data Deletion** (URL de instrucciones o callback). Ver `docs/legal/politica-de-privacidad.md` y `docs/legal/borrado-de-datos.md`.

## FASE 6 — Conectar con Supabase (Redirect URI) · [BLOQUEADO — proyecto Supabase]

18. En **Supabase → Authentication → Providers → Facebook**: copiar el **Callback URL** (`https://<ref>.supabase.co/auth/v1/callback`).
19. En **Meta → Facebook Login → Settings → "Valid OAuth Redirect URIs"**: pegar esa URL **exacta** (sin barra final, sin espacios ni typos).
20. En Supabase, pegar **App ID** + **App Secret** y **activar** el provider.

## FASE 7 — Probar en modo desarrollo · [cuando la Fase 6 esté lista]

21. En modo Development solo entran usuarios con rol en la app.
22. En **App Roles / Roles**, agregar a los 3 devs como Administrator / Developer / Tester.
23. Probar el login con esas cuentas.

## FASE 8 — Publicar (Live) · [BLOQUEADO — dominio + verificación]

24. Completar todo Settings → Basic (Privacy Policy + Data Deletion incluidas).
25. **Business Verification:** Meta puede exigir verificar el negocio (aplica a toda la cuenta) antes de usar permisos en Live; suele pedir documentación de la entidad/empresa.
26. Cambiar el toggle de la app a **"Live"**.
27. Para `public_profile` + `email` básicos, muchas veces no requiere App Review detallado, pero sí Settings→Basic completo y, según la cuenta, Business Verification. Si pide **App Review**: enviar instrucciones de prueba + screencast del login + explicación del uso de datos (1–5 días hábiles).

---

## Resumen — qué se puede hacer HOY

| Se puede ya | Espera |
|---|---|
| Crear cuenta + app (Fases 1-2) | Redirect URI → proyecto Supabase |
| Permiso de email (Fase 3) | App Domain + Privacy Policy → dominio |
| Copiar App ID + Secret (Fase 4) | Publicar Live + Business Verification |
| Ícono, categoría, contacto (Fase 5 parcial) | |
