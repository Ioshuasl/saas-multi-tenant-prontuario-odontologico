-- ADR-0016: WAHA session por tenant; templates ACTIVE; lookup por session_name

ALTER TABLE "whatsapp_account"
  ADD COLUMN IF NOT EXISTS "session_name" TEXT,
  ADD COLUMN IF NOT EXISTS "risk_accepted_at" TIMESTAMPTZ;

UPDATE "whatsapp_account"
SET "session_name" = 'legacy_' || replace("id"::text, '-', '')
WHERE "session_name" IS NULL;

ALTER TABLE "whatsapp_account"
  ALTER COLUMN "session_name" SET NOT NULL,
  ALTER COLUMN "waba_id" DROP NOT NULL,
  ALTER COLUMN "phone_number_id" DROP NOT NULL,
  ALTER COLUMN "display_phone" DROP NOT NULL,
  ALTER COLUMN "access_token_ref" DROP NOT NULL;

DROP INDEX IF EXISTS "uq_whatsapp_account_phone_number_id";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_whatsapp_account_session_name"
  ON "whatsapp_account" ("session_name");

CREATE OR REPLACE FUNCTION platform.resolve_whatsapp_account_by_session_name(p_session_name text)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  status text,
  kill_switch boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wa.id, wa.tenant_id, wa.status, wa.kill_switch
  FROM whatsapp_account wa
  WHERE wa.session_name = p_session_name
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION platform.resolve_whatsapp_account_by_session_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.resolve_whatsapp_account_by_session_name(text) TO app_user;

UPDATE "message_template"
SET "status" = 'ACTIVE'
WHERE "status" = 'APPROVED';

UPDATE "message_template"
SET "body" = "body" || E'\n\nResponda CONFIRMAR ou CANCELAR.'
WHERE "key" = 'appointment_confirmation'
  AND "body" NOT LIKE '%CONFIRMAR%';

UPDATE "message_template"
SET "body" = "body" || E'\n\nResponda QUERO ESTE HORÁRIO para aceitar.'
WHERE "key" = 'waitlist_offer'
  AND "body" NOT LIKE '%QUERO ESTE%';
