ALTER TABLE "cash_session"
  ADD COLUMN "idempotency_key" TEXT,
  ADD COLUMN "close_idempotency_key" TEXT;

CREATE UNIQUE INDEX "uq_cash_session_idempotency"
  ON "cash_session" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

CREATE UNIQUE INDEX "uq_cash_session_close_idempotency"
  ON "cash_session" ("tenant_id", "close_idempotency_key")
  WHERE "close_idempotency_key" IS NOT NULL;
