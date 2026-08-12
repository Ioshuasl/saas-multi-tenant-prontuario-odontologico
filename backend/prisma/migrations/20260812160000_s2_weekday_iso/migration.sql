-- Canonical weekday: ISO 1=Mon … 7=Sun (was CHECK 0–6).
-- Existing seeds use 1–5 (Mon–Fri); convert legacy Sunday 0 → 7 if present.

UPDATE "business_hours"
SET "weekday" = 7
WHERE "weekday" = 0;

ALTER TABLE "business_hours"
  DROP CONSTRAINT "business_hours_weekday_check";

ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_weekday_check"
  CHECK ("weekday" BETWEEN 1 AND 7);
