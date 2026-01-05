-- ============================================
-- Actualizar Planes: 3 planes con 7 días trial
-- ============================================
BEGIN;

-- Eliminar planes existentes
DELETE FROM plans;

-- Insertar los 3 nuevos planes
INSERT INTO plans ("planId", "name", "description", "priceMonthly", "priceYearly", "features", "trialDays", "isActive", "isPopular", "sortOrder", "maxUsers", "maxProperties", "maxClients", "maxStorageGB", "currency")
VALUES
  (
    'basic', 
    'Plan Básico', 
    'Perfecto para empezar - 1 usuario',
    9900,
    99000,
    '{"pdfTemplates": true, "customTemplates": false, "whatsappIntegration": false, "estadisticas": true, "exportData": true, "apiAccess": false, "customDomain": false, "prioritySupport": false, "landingPage": false, "mercadoLibreIntegration": false, "agentRole": false}'::jsonb,
    7,
    true,
    false,
    1,
    1,
    50,
    100,
    5,
    'ARS'
  ),
  (
    'professional', 
    'Plan Profesional', 
    'Para equipos de trabajo - Landing + ML + Agentes',
    29900,
    299000,
    '{"pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true, "estadisticas": true, "exportData": true, "apiAccess": true, "customDomain": false, "prioritySupport": true, "landingPage": true, "mercadoLibreIntegration": true, "agentRole": true}'::jsonb,
    7,
    true,
    true,
    2,
    5,
    200,
    500,
    20,
    'ARS'
  ),
  (
    'enterprise', 
    'Plan Empresarial', 
    'Para grandes inmobiliarias - Todo ilimitado',
    69900,
    699000,
    '{"pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true, "estadisticas": true, "exportData": true, "apiAccess": true, "customDomain": true, "prioritySupport": true, "landingPage": true, "mercadoLibreIntegration": true, "agentRole": true}'::jsonb,
    7,
    true,
    false,
    3,
    20,
    -1,
    -1,
    100,
    'ARS'
  );

COMMIT;

-- Verificación
SELECT "planId", "name", "priceMonthly", "trialDays", "maxUsers", "maxProperties", 
       "features"->>'landingPage' as landing,
       "features"->>'mercadoLibreIntegration' as ml,
       "features"->>'agentRole' as agentes
FROM plans 
ORDER BY "sortOrder";

\echo ''
\echo '✅ Planes actualizados:'
\echo '  - Basic: 1 usuario, sin landing/ML/agentes'
\echo '  - Professional: 5 usuarios, CON landing/ML/agentes'
\echo '  - Enterprise: 20 usuarios, CON landing/ML/agentes + ilimitado'
