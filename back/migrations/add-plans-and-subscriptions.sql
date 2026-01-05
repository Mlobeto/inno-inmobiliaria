-- ============================================
-- Migración: Sistema de Planes y Suscripciones
-- Fecha: 2025-12-30
-- Descripción: Crea tablas para gestionar planes y suscripciones con MercadoPago
-- ============================================

BEGIN;

-- ============================================
-- Tabla: plans
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  "planId" VARCHAR(50) PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  
  -- Precios
  "priceMonthly" DECIMAL(10, 2) NOT NULL,
  "priceYearly" DECIMAL(10, 2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
  
  -- IDs externos
  "mpPlanId" VARCHAR(100),
  "stripePriceId" VARCHAR(100),
  
  -- Features (JSONB)
  "features" JSONB NOT NULL DEFAULT '{}',
  
  -- Configuración
  "trialDays" INTEGER NOT NULL DEFAULT 14,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para plans
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans("isActive");
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans("sortOrder");

-- Comentarios
COMMENT ON TABLE plans IS 'Planes de suscripción disponibles';
COMMENT ON COLUMN plans."planId" IS 'ID único del plan (ej: basic, professional, enterprise)';
COMMENT ON COLUMN plans."features" IS 'JSON con features del plan: maxProperties, maxClients, etc.';
COMMENT ON COLUMN plans."trialDays" IS 'Días de prueba gratis';

-- ============================================
-- Tabla: subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  "subscriptionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "planId" VARCHAR(50) NOT NULL REFERENCES plans("planId") ON DELETE RESTRICT,
  
  -- Estado
  "status" VARCHAR(20) NOT NULL DEFAULT 'trialing' CHECK ("status" IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  
  -- Procesador de pago
  "paymentProvider" VARCHAR(20) NOT NULL DEFAULT 'mercadopago' CHECK ("paymentProvider" IN ('mercadopago', 'stripe', 'manual', 'app_store', 'google_play')),
  
  -- MercadoPago
  "mpPreferenceId" VARCHAR(100),
  "mpSubscriptionId" VARCHAR(100),
  "mpPayerId" VARCHAR(100),
  "mpPaymentId" VARCHAR(100),
  
  -- Stripe (futuro)
  "stripeSubscriptionId" VARCHAR(100),
  "stripeCustomerId" VARCHAR(100),
  
  -- App Store / Google Play (futuro)
  "storeSubscriptionId" VARCHAR(100),
  "storeReceipt" TEXT,
  
  -- Períodos
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "trialStart" TIMESTAMP,
  "trialEnd" TIMESTAMP,
  "canceledAt" TIMESTAMP,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  
  -- Billing
  "billingCycle" VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK ("billingCycle" IN ('monthly', 'yearly')),
  "amount" DECIMAL(10, 2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
  
  -- Metadata
  "metadata" JSONB DEFAULT '{}',
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions("tenantId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions("status");
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions("paymentProvider");
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions("currentPeriodEnd");

-- Índice único: solo una suscripción activa por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_per_tenant
  ON subscriptions("tenantId", "status")
  WHERE "status" IN ('trialing', 'active');

-- Comentarios
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de cada inmobiliaria';
COMMENT ON COLUMN subscriptions."status" IS 'trialing: en prueba, active: activa, past_due: pago vencido, canceled: cancelada';
COMMENT ON COLUMN subscriptions."paymentProvider" IS 'Procesador de pago: mercadopago, stripe, manual, app_store, google_play';

-- ============================================
-- Trigger para actualizar updatedAt
-- ============================================
CREATE OR REPLACE FUNCTION update_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_timestamp();

-- ============================================
-- Insertar planes por defecto (todos con 7 días de prueba)
-- ============================================
INSERT INTO plans ("planId", "name", "description", "priceMonthly", "priceYearly", "features", "trialDays", "isActive", "isPopular", "sortOrder")
VALUES
  ('basic', 'Plan Básico', 'Perfecto para empezar - 1 usuario', 9900, 99000,
   '{"maxProperties": 50, "maxClients": 100, "maxUsers": 1, "maxStorageGB": 5, "pdfTemplates": true, "customTemplates": false, "whatsappIntegration": false, "estadisticas": true, "exportData": true, "apiAccess": false, "customDomain": false, "prioritySupport": false, "landingPage": false, "mercadoLibreIntegration": false, "agentRole": false}'::jsonb,
   7, true, false, 1),
   
  ('professional', 'Plan Profesional', 'Para equipos de trabajo', 29900, 299000,
   '{"maxProperties": 200, "maxClients": 500, "maxUsers": 5, "maxStorageGB": 20, "pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true, "estadisticas": true, "exportData": true, "apiAccess": true, "customDomain": false, "prioritySupport": true, "landingPage": true, "mercadoLibreIntegration": true, "agentRole": true}'::jsonb,
   7, true, true, 2),
   
  ('enterprise', 'Plan Empresarial', 'Para grandes inmobiliarias', 69900, 699000,
   '{"maxProperties": -1, "maxClients": -1, "maxUsers": 20, "maxStorageGB": 100, "pdfTemplates": true, "customTemplates": true, "whatsappIntegration": true, "estadisticas": true, "exportData": true, "apiAccess": true, "customDomain": true, "prioritySupport": true, "landingPage": true, "mercadoLibreIntegration": true, "agentRole": true}'::jsonb,
   7, true, false, 3)
ON CONFLICT ("planId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "priceYearly" = EXCLUDED."priceYearly",
  "features" = EXCLUDED."features",
  "trialDays" = EXCLUDED."trialDays",
  "isActive" = EXCLUDED."isActive",
  "isPopular" = EXCLUDED."isPopular",
  "sortOrder" = EXCLUDED."sortOrder";

-- Desactivar plan gratuito si existe
UPDATE plans SET "isActive" = false WHERE "planId" = 'free';

COMMIT;

-- ============================================
-- Verificación
-- ============================================
\echo '✅ Migración completada: Sistema de Planes y Suscripciones'
\echo ''
\echo 'Tablas creadas:'
\echo '  - plans (3 planes: Basic, Professional, Enterprise - todos con 7 días trial)'
\echo '  - subscriptions'
\echo ''
\echo 'Planes disponibles:'
SELECT "planId", "name", "priceMonthly", "isActive" FROM plans ORDER BY "sortOrder";
