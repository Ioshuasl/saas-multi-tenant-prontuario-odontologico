-- Sprint 3 Bloco 4: messaging E8a (WhatsApp Cloud + créditos + automations)

CREATE TABLE "whatsapp_account" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "unit_id" UUID,
  "waba_id" TEXT NOT NULL,
  "phone_number_id" TEXT NOT NULL,
  "display_phone" TEXT NOT NULL,
  "access_token_ref" TEXT NOT NULL,
  "webhook_verified_at" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "kill_switch" BOOLEAN NOT NULL DEFAULT false,
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_account_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "whatsapp_account_unit_id_fkey"
    FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_whatsapp_account_tenant" ON "whatsapp_account" ("tenant_id");
CREATE UNIQUE INDEX "uq_whatsapp_account_phone_number_id" ON "whatsapp_account" ("phone_number_id");

CREATE TABLE "message_template" (
  "id" UUID NOT NULL,
  "tenant_id" UUID,
  "key" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'pt_BR',
  "provider_name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "variables" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_template_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "message_template_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_message_template_global_key"
  ON "message_template" ("key") WHERE "tenant_id" IS NULL;
CREATE UNIQUE INDEX "uq_message_template_tenant_key"
  ON "message_template" ("tenant_id", "key") WHERE "tenant_id" IS NOT NULL;

CREATE TABLE "conversation" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "whatsapp_account_id" UUID NOT NULL,
  "patient_id" UUID,
  "contact_phone" TEXT NOT NULL,
  "contact_name" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "assigned_to" UUID,
  "service_window_expires_at" TIMESTAMPTZ,
  "last_message_at" TIMESTAMPTZ,
  "unread_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conversation_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "conversation_whatsapp_account_id_fkey"
    FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "conversation_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_conversation_contact"
  ON "conversation" ("tenant_id", "whatsapp_account_id", "contact_phone");
CREATE INDEX "idx_conversation_inbox"
  ON "conversation" ("tenant_id", "status", "last_message_at" DESC);

CREATE TABLE "message" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "direction" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "template_id" UUID,
  "body" TEXT,
  "media_key" TEXT,
  "provider_message_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "error_code" TEXT,
  "error_message" TEXT,
  "billable" BOOLEAN NOT NULL DEFAULT false,
  "cost_cents" INTEGER,
  "related_type" TEXT,
  "related_id" UUID,
  "sent_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "message_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "message_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "message_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "message_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_message_provider_id"
  ON "message" ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;
CREATE INDEX "idx_message_conversation"
  ON "message" ("tenant_id", "conversation_id", "created_at");
CREATE INDEX "idx_message_logs"
  ON "message" ("tenant_id", "created_at" DESC);

CREATE TABLE "automation" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "automation_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_automation_tenant_key" ON "automation" ("tenant_id", "key");

CREATE TABLE "automation_run" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "automation_id" UUID NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "scheduled_for" TIMESTAMPTZ NOT NULL,
  "executed_at" TIMESTAMPTZ,
  "result" TEXT,
  "message_id" UUID,
  CONSTRAINT "automation_run_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "automation_run_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "automation_run_automation_id_fkey"
    FOREIGN KEY ("automation_id") REFERENCES "automation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "automation_run_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Idempotência: um run por automação + alvo (sem scheduled_for na unique — docs/07).
CREATE UNIQUE INDEX "uq_automation_run_target"
  ON "automation_run" ("tenant_id", "automation_id", "target_type", "target_id");
CREATE INDEX "idx_automation_run_scheduled"
  ON "automation_run" ("tenant_id", "scheduled_for");

CREATE TABLE "message_credit_ledger" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "amount_cents" BIGINT NOT NULL,
  "message_id" UUID,
  "balance_after_cents" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_credit_ledger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "message_credit_ledger_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "message_credit_ledger_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_credit_ledger_tenant"
  ON "message_credit_ledger" ("tenant_id", "created_at" DESC);

SELECT platform.enable_tenant_rls('whatsapp_account');
SELECT platform.enable_tenant_rls('conversation');
SELECT platform.enable_tenant_rls('message');
SELECT platform.enable_tenant_rls('automation');
SELECT platform.enable_tenant_rls('automation_run');
SELECT platform.enable_tenant_rls('message_credit_ledger');

-- Templates globais (tenant_id NULL) visíveis a todos; escrita só do próprio tenant.
ALTER TABLE "message_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_template" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "message_template";
CREATE POLICY message_template_select ON "message_template"
  FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
  );
CREATE POLICY message_template_write ON "message_template"
  FOR ALL
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "whatsapp_account",
  "message_template",
  "conversation",
  "message",
  "automation",
  "automation_run",
  "message_credit_ledger"
TO app_user;

CREATE OR REPLACE FUNCTION platform.resolve_whatsapp_account_by_phone_number_id(p_phone_number_id text)
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
  WHERE wa.phone_number_id = p_phone_number_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION platform.resolve_whatsapp_account_by_phone_number_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.resolve_whatsapp_account_by_phone_number_id(text) TO app_user;

INSERT INTO "message_template" (
  "id", "tenant_id", "key", "category", "language", "provider_name", "body", "variables", "status"
) VALUES
(
  'a1000000-0000-4000-8000-000000000001',
  NULL,
  'appointment_created',
  'UTILITY',
  'pt_BR',
  'appointment_created',
  'Olá {{nome}}, seu horário na {{clinica}} foi agendado para {{data}} às {{hora}}.',
  '["nome","clinica","data","hora"]'::jsonb,
  'APPROVED'
),
(
  'a1000000-0000-4000-8000-000000000002',
  NULL,
  'appointment_confirmation',
  'UTILITY',
  'pt_BR',
  'appointment_confirmation',
  'Olá {{nome}}, confirme sua consulta na {{clinica}} em {{data}} às {{hora}}.',
  '["nome","clinica","data","hora"]'::jsonb,
  'APPROVED'
),
(
  'a1000000-0000-4000-8000-000000000003',
  NULL,
  'appointment_reminder',
  'UTILITY',
  'pt_BR',
  'appointment_reminder',
  'Lembrete: {{nome}}, sua consulta na {{clinica}} é hoje {{data}} às {{hora}}.',
  '["nome","clinica","data","hora"]'::jsonb,
  'APPROVED'
),
(
  'a1000000-0000-4000-8000-000000000004',
  NULL,
  'appointment_cancelled',
  'UTILITY',
  'pt_BR',
  'appointment_cancelled',
  '{{nome}}, sua consulta na {{clinica}} em {{data}} às {{hora}} foi cancelada.',
  '["nome","clinica","data","hora"]'::jsonb,
  'APPROVED'
),
(
  'a1000000-0000-4000-8000-000000000005',
  NULL,
  'waitlist_offer',
  'UTILITY',
  'pt_BR',
  'waitlist_offer',
  '{{nome}}, abriu um horário na {{clinica}} em {{data}} às {{hora}}. Responda para aceitar.',
  '["nome","clinica","data","hora"]'::jsonb,
  'APPROVED'
)
ON CONFLICT DO NOTHING;
