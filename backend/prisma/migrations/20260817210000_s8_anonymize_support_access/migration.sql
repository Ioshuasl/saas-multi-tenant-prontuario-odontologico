-- S8 Bloco 4: anonimização (DSR DELETION) + break-glass (RF-E11-08/13/14).
-- support_access vive no schema platform, sem RLS de tenant (docs/06 §9).

ALTER TABLE "user" ADD COLUMN "platform_role" TEXT;
ALTER TABLE "user" ADD CONSTRAINT "user_platform_role_check"
  CHECK ("platform_role" IS NULL OR "platform_role" IN ('OPERATOR'));

CREATE TABLE platform.support_access (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "requester_id" UUID NOT NULL,
  "approver_id" UUID,
  "reason" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'clinical.read',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "hours" SMALLINT NOT NULL DEFAULT 4,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_access_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_access_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES public."tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "support_access_requester_id_fkey"
    FOREIGN KEY ("requester_id") REFERENCES public."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "support_access_approver_id_fkey"
    FOREIGN KEY ("approver_id") REFERENCES public."user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "support_access_status_check"
    CHECK ("status" IN ('PENDING', 'APPROVED', 'DENIED')),
  CONSTRAINT "support_access_reason_len"
    CHECK (char_length("reason") >= 20),
  CONSTRAINT "support_access_hours_check"
    CHECK ("hours" >= 1 AND "hours" <= 4),
  CONSTRAINT "support_access_four_eyes"
    CHECK ("approver_id" IS NULL OR "approver_id" <> "requester_id")
);

CREATE INDEX "idx_support_access_tenant_created"
  ON platform.support_access ("tenant_id", "created_at" DESC);

CREATE INDEX "idx_support_access_requester"
  ON platform.support_access ("requester_id", "created_at" DESC);

GRANT SELECT, INSERT, UPDATE ON TABLE platform.support_access TO app_user;
