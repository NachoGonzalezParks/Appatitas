# Setup — Google OAuth (login con Google) con Supabase Auth

**Responsable:** dev3 (Integraciones · Auth)
**Tarea:** S0-04 (proveedor Google) · HU-001
**Fuente verificada:** [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

> A diferencia de Facebook, Google **no exige revisión** para el login básico (email/perfil),
> y ya tenemos la URL del proyecto Supabase. Por eso esto se puede hacer **de punta a punta**.
> Los nombres de botones en Google Cloud cambian seguido; si alguno difiere, buscá el equivalente.

## Valores exactos que vas a usar

- **Authorized redirect URI:** `https://umygqujdmuutqjgiexwn.supabase.co/auth/v1/callback`
- **Authorized JavaScript origin (dev):** `http://localhost:5173`

*(El origin de producción queda pendiente del dominio; para staging/probar alcanza `localhost`.)*

---

## FASE 0 — Cuenta

- Idealmente el proyecto de Google Cloud va a nombre **del proyecto/empresa**, no personal
  (una cuenta personal funciona; se puede migrar después).

## FASE 1 — Google Cloud (lo hace dev3)

1. Entrar a **console.cloud.google.com** → crear un proyecto (ej. `appatitas`).
2. **Configurar la pantalla de consentimiento** (menú *Google Auth Platform* / *OAuth consent screen*):
   - **User type:** External.
   - **App name:** `APPATITAS` (se le muestra al usuario al loguear; se puede editar después).
   - **Support email** + **developer contact email**.
   - **Scopes:** agregar `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
     (son **no sensibles → no requieren verificación** de Google).
   - **Publishing:** dejar en **"Testing"** y agregar a los **3 devs como test users** para probar ya.
     Cuando se quiera abrir a todos, publicar a "In production" (sin verificación por ser scopes básicos).
3. **Crear credenciales:** *Credentials → Create credentials → OAuth client ID*:
   - **Application type:** **Web application**.
   - **Name:** ej. `APPATITAS Web (staging)`.
   - **Authorized JavaScript origins:** `http://localhost:5173`
   - **Authorized redirect URIs:** `https://umygqujdmuutqjgiexwn.supabase.co/auth/v1/callback`
     (exacto, sin barra final).
4. Copiar el **Client ID** y el **Client Secret**. El **Secret es secreto** → guardarlo en el
   gestor seguro, **nunca al repo**.

## FASE 2 — Supabase (panel; dev3 tiene acceso)

5. Dashboard → **Authentication → Providers → Google** → **Enable** →
   pegar **Client ID** y **Client Secret** → **Save**.
6. Dejar **"Skip nonce check"** como viene por defecto (habilitado el nonce). Solo desactivarlo si
   un cliente puntual lo requiere.

## FASE 3 — Probar

7. Levantar la app (`npm run dev`) y probar **"Login con Google"** con una cuenta *test user*.

---

## ⚠️ Detalles a tener en cuenta

- **Si Google se queja del dominio del redirect:** en la pantalla de consentimiento, agregar
  `supabase.co` en *Authorized domains*.
- **Client Secret:** nunca al repo; va al panel de Supabase (como las demás claves).
- **Producción:** falta agregar el *JavaScript origin* del **dominio** (pendiente) — es un paso
  posterior; staging ya funciona con `localhost`.
- **Config por panel:** el equipo maneja Auth por el panel (sin `config.toml`), así que el
  proveedor se activa desde el dashboard, no por CLI.
