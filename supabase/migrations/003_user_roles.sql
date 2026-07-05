-- 003_user_roles.sql
-- Roles por usuario. Un usuario puede tener más de un rol (tutor, provider, admin).

CREATE TABLE user_roles (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('tutor', 'provider', 'admin')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, role)
);
