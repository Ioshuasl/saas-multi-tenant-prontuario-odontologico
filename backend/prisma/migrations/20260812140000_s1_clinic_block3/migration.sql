-- Sprint 1 Bloco 3: payment methods + onboarding wizard state on tenant

ALTER TABLE "tenant"
  ADD COLUMN IF NOT EXISTS "accepted_payment_methods" text[] NOT NULL DEFAULT '{CASH,PIX,CREDIT_CARD,DEBIT_CARD}',
  ADD COLUMN IF NOT EXISTS "onboarding" jsonb NOT NULL DEFAULT '{"skippedSteps":[]}'::jsonb;
