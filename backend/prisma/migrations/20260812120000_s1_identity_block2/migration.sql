-- Sprint 1 Bloco 2: reset de senha, membership no refresh, aceite de convite por token (RLS)

CREATE TABLE "password_reset_token" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON "password_reset_token"("token_hash");
CREATE INDEX "password_reset_token_user_id_idx" ON "password_reset_token"("user_id");

ALTER TABLE "refresh_token" ADD COLUMN "membership_id" UUID;
ALTER TABLE "refresh_token"
  ADD CONSTRAINT "refresh_token_membership_id_fkey"
  FOREIGN KEY ("membership_id") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Aceite público: SELECT pelo hash do token (set_config na mesma transação)
CREATE POLICY invitation_select_by_token ON "invitation"
  FOR SELECT
  USING (
    token_hash = nullif(current_setting('app.invitation_token_hash', true), '')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "password_reset_token" TO app_user;
