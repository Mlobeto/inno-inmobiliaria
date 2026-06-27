-- ============================================================
-- Migración: Sistema de módulos add-on
-- Reemplaza los planes tiered por base + módulos opcionales
-- ============================================================

-- 1. Tabla de catálogo de módulos
CREATE TABLE IF NOT EXISTS modules (
  "moduleId"    VARCHAR(50)     PRIMARY KEY,
  "name"        VARCHAR(100)    NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(10, 2)  NOT NULL,
  "currency"    VARCHAR(3)      NOT NULL DEFAULT 'ARS',
  "featureKeys" JSONB           NOT NULL DEFAULT '[]',
  "question"    VARCHAR(500),
  "icon"        VARCHAR(50),
  "sortOrder"   INTEGER         NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN         NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_active     ON modules ("isActive");
CREATE INDEX IF NOT EXISTS idx_modules_sort_order ON modules ("sortOrder");

-- 2. Tabla de módulos activos por tenant
CREATE TABLE IF NOT EXISTS tenant_modules (
  "id"          SERIAL          PRIMARY KEY,
  "tenantId"    INTEGER         NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "moduleId"    VARCHAR(50)     NOT NULL REFERENCES modules("moduleId"),
  "status"      VARCHAR(20)     NOT NULL DEFAULT 'active',
  "activatedAt" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "canceledAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_modules UNIQUE ("tenantId", "moduleId")
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules ("tenantId");
CREATE INDEX IF NOT EXISTS idx_tenant_modules_module ON tenant_modules ("moduleId");
CREATE INDEX IF NOT EXISTS idx_tenant_modules_status ON tenant_modules ("status");

-- 3. Actualizar plan base en la tabla plans
--    Eliminamos planes viejos y dejamos solo el base
DELETE FROM plans WHERE "planId" NOT IN ('base', 'lifetime');

INSERT INTO plans ("planId", "name", "description", "priceMonthly", "currency", "features", "trialDays", "isActive", "isPopular", "sortOrder")
VALUES (
  'base',
  'Plan Base',
  'Gestión completa de alquileres y ventas: propiedades, contratos, cuotas, recibos y balance.',
  10000.00,
  'ARS',
  '{
    "properties": true,
    "rentals": true,
    "sales": true,
    "clients": true,
    "contracts": true,
    "receipts": true,
    "balance": true,
    "pdfTemplates": true,
    "estadisticas": true,
    "exportData": true,
    "maxProperties": -1,
    "maxClients": -1,
    "maxUsers": 2
  }',
  7,
  TRUE,
  FALSE,
  0
)
ON CONFLICT ("planId") DO UPDATE SET
  "name"         = EXCLUDED."name",
  "description"  = EXCLUDED."description",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "features"     = EXCLUDED."features",
  "trialDays"    = EXCLUDED."trialDays",
  "isActive"     = EXCLUDED."isActive",
  "updatedAt"    = NOW();
