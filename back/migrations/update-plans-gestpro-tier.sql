-- Reorganización de planes: Básico / Profesional / GestPRO / Lifetime
-- Ejecutar: npx prisma db execute --file migrations/update-plans-gestpro-tier.sql

BEGIN;

-- Plan Básico: core sin ML, leads, landing, portal, agentes, facturación ni loteos
UPDATE plans SET
  "name" = 'Plan Básico',
  "description" = 'Gestión completa de propiedades, clientes, contratos y cobros — 1 usuario',
  "features" = '{
    "maxProperties": 50, "maxClients": 100, "maxUsers": 1, "maxStorageGB": 5,
    "pdfTemplates": true, "customTemplates": false, "whatsappIntegration": false,
    "estadisticas": true, "exportData": true, "apiAccess": false,
    "customDomain": false, "prioritySupport": false,
    "landingPage": false, "portalInquilino": false,
    "mercadoLibreIntegration": false, "agentRole": false,
    "electronicInvoicing": false, "electronic_invoicing": false,
    "leads": false, "loteos": false
  }'::jsonb,
  "sortOrder" = 1,
  "isActive" = true,
  "isPopular" = false
WHERE "planId" = 'basic';

-- Plan Profesional: básico + ML + leads + landing + portal inquilinos
UPDATE plans SET
  "name" = 'Plan Profesional',
  "description" = 'Básico + Mercado Libre, CRM Leads, landing pública y portal de inquilinos',
  "features" = '{
    "maxProperties": 200, "maxClients": 500, "maxUsers": 5, "maxStorageGB": 20,
    "pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true,
    "estadisticas": true, "exportData": true, "apiAccess": true,
    "customDomain": false, "prioritySupport": true,
    "landingPage": true, "portalInquilino": true,
    "mercadoLibreIntegration": true, "leads": true,
    "agentRole": false, "electronicInvoicing": false, "electronic_invoicing": false,
    "loteos": false
  }'::jsonb,
  "sortOrder" = 2,
  "isActive" = true,
  "isPopular" = true
WHERE "planId" = 'professional';

-- Plan GestPRO (nuevo tier top)
INSERT INTO plans (
  "planId", "name", "description", "priceMonthly", "priceYearly", "currency",
  "features", "trialDays", "isActive", "isPopular", "sortOrder"
) VALUES (
  'gestpro',
  'Plan GestPRO',
  'Todo Profesional + agentes y comisiones, facturación ARCA/AFIP y loteos',
  99900, 999000, 'ARS',
  '{
    "maxProperties": -1, "maxClients": -1, "maxUsers": 20, "maxStorageGB": 100,
    "pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true,
    "estadisticas": true, "exportData": true, "apiAccess": true,
    "customDomain": true, "prioritySupport": true,
    "landingPage": true, "portalInquilino": true,
    "mercadoLibreIntegration": true, "leads": true,
    "agentRole": true, "electronicInvoicing": true, "electronic_invoicing": true,
    "loteos": true
  }'::jsonb,
  7, true, false, 3
)
ON CONFLICT ("planId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "priceYearly" = EXCLUDED."priceYearly",
  "features" = EXCLUDED."features",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "isPopular" = EXCLUDED."isPopular";

-- Lifetime: igual que GestPRO, oculto en front
UPDATE plans SET
  "name" = 'Plan Lifetime',
  "description" = 'Acceso permanente GestPRO — solo asignación manual por Platform Admin',
  "features" = '{
    "maxProperties": -1, "maxClients": -1, "maxUsers": 20, "maxStorageGB": 100,
    "pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true,
    "estadisticas": true, "exportData": true, "apiAccess": true,
    "customDomain": true, "prioritySupport": true,
    "landingPage": true, "portalInquilino": true,
    "mercadoLibreIntegration": true, "leads": true,
    "agentRole": true, "electronicInvoicing": true, "electronic_invoicing": true,
    "loteos": true
  }'::jsonb,
  "sortOrder" = 4,
  "isActive" = true,
  "isPopular" = false
WHERE "planId" = 'lifetime';

-- Desactivar planes legacy
UPDATE plans SET "isActive" = false WHERE "planId" IN ('enterprise', 'agencia');

COMMIT;

SELECT "planId", "name", "isActive", "sortOrder",
       "features"->>'leads' AS leads,
       "features"->>'agentRole' AS agentes,
       "features"->>'portalInquilino' AS portal
FROM plans ORDER BY "sortOrder";
