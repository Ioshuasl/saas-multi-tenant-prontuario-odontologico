-- S7 Bloco 1: Idempotency-Key em POST /messaging/conversations/:id/messages
ALTER TABLE "message"
  ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "uq_message_idempotency"
  ON "message" ("tenant_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
