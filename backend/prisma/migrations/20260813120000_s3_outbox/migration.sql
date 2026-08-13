-- Sprint 3 Bloco 1: outbox transacional (docs/07 §9, ADR-0006, docs/06)

CREATE TABLE "outbox_event" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ,
  "attempts" SMALLINT NOT NULL DEFAULT 0,
  "last_error" TEXT,
  CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outbox_event_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "idx_outbox_pending"
  ON "outbox_event" ("processed_at", "occurred_at")
  WHERE "processed_at" IS NULL;

SELECT platform.enable_tenant_rls('outbox_event');

-- Dispatcher lê pendentes de todos os tenants (bypass controlado, docs/06 §6)
CREATE POLICY outbox_dispatch_select ON "outbox_event"
  FOR SELECT
  USING (current_setting('app.outbox_dispatch', true) = 'on');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "outbox_event" TO app_user;
