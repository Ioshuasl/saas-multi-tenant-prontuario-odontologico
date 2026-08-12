-- Grants omitted when 20260812180000 already applied without them.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "patient_code_counter",
  "patient",
  "legal_guardian",
  "consent"
TO app_user;
