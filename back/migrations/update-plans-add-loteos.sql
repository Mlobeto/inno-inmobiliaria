-- Actualiza los features de planes para incluir loteos: true
-- en professional, lifetime y agencia

UPDATE plans
SET features = jsonb_set(
  COALESCE(features::jsonb, '{}'::jsonb),
  '{loteos}',
  'true'::jsonb
)
WHERE "planId" IN ('professional', 'lifetime', 'agencia');

-- También incluir leads true en agencia y lifetime por si no estaban
UPDATE plans
SET features = jsonb_set(
  COALESCE(features::jsonb, '{}'::jsonb),
  '{leads}',
  'true'::jsonb
)
WHERE "planId" IN ('lifetime', 'agencia');

-- Verificar resultado
SELECT "planId", features->>'loteos' AS loteos, features->>'leads' AS leads
FROM plans
ORDER BY "sortOrder";
