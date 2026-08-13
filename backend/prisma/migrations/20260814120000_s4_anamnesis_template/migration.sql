INSERT INTO "message_template" (
  "id", "tenant_id", "key", "category", "language", "provider_name", "body", "variables", "status"
) VALUES (
  'a1000000-0000-4000-8000-000000000006',
  NULL,
  'anamnesis_request',
  'UTILITY',
  'pt_BR',
  'anamnesis_request',
  'Olá {{nome}}, preencha sua anamnese da {{clinica}}: {{link}}',
  '["nome","clinica","link"]'::jsonb,
  'APPROVED'
)
ON CONFLICT DO NOTHING;
