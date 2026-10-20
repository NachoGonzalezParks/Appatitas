-- 025_rls_push_subscriptions.sql
-- RLS para push_subscriptions (RFC-001, Sprint 2).

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona solo sus propias suscripciones push.
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());
