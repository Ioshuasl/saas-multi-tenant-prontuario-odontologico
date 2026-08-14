ALTER TABLE "payment"
  ADD COLUMN "reversal_idempotency_key" TEXT;

CREATE UNIQUE INDEX "uq_payment_reversal_idempotency"
  ON "payment" ("tenant_id", "reversal_idempotency_key")
  WHERE "reversal_idempotency_key" IS NOT NULL;
