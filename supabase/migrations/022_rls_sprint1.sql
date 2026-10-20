-- 022_rls_sprint1.sql
-- Políticas RLS para Sprint 1: users, user_roles, pets.
-- Nota: estas políticas ya estaban aplicadas en staging desde Sprint 0.
-- Esta migración las documenta para que queden en el historial del repo.

-- ─── USERS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve el suyo; admin ve todos.
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Cada usuario edita solo el suyo.
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- INSERT solo via trigger on_auth_user_created (SECURITY DEFINER).
-- DELETE nunca permitido.

-- ─── USER_ROLES ──────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve los suyos; admin ve todos.
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- El propio usuario puede agregar rol tutor o provider.
CREATE POLICY "user_roles_insert_self" ON public.user_roles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = ANY (ARRAY['tutor'::text, 'provider'::text])
  );

-- Admin puede insertar el rol admin.
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') AND role = 'admin'
  );

-- Solo admin puede borrar roles.
CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ─── PETS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Cada tutor ve, crea y edita solo sus propias mascotas.
-- El filtro deleted_at IS NULL se aplica en el código (no a nivel RLS).
CREATE POLICY "pets_select" ON public.pets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pets_insert" ON public.pets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pets_update" ON public.pets
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE nunca permitido (baja lógica via RPC soft_delete_pet).
