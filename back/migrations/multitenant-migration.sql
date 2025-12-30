-- ============================================================================
-- MIGRACIÓN MULTITENANT - INMOBILIARIA SaaS
-- Fecha: 2025-12-30
-- Descripción: Migración completa para convertir el sistema en multitenant
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR TABLA TENANTS (Inmobiliarias)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  "tenantId" SERIAL PRIMARY KEY,
  "businessName" VARCHAR(255) NOT NULL,
  "cuit" VARCHAR(13) UNIQUE NOT NULL,
  "subdomain" VARCHAR(100) UNIQUE NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "address" TEXT,
  "logo" VARCHAR(500),
  "plan" VARCHAR(50) DEFAULT 'FREE', -- FREE, BASIC, PROFESSIONAL, ENTERPRISE
  "status" VARCHAR(50) DEFAULT 'TRIAL', -- TRIAL, ACTIVE, SUSPENDED, CANCELLED
  "maxAgents" INTEGER DEFAULT 1,
  "maxProperties" INTEGER DEFAULT 10,
  "features" JSONB DEFAULT '{"whatsapp": false, "ml": false, "reports": true, "contracts": true}',
  "trialEndsAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

CREATE INDEX idx_tenants_subdomain ON tenants("subdomain");
CREATE INDEX idx_tenants_status ON tenants("status");

-- ============================================================================
-- 2. ACTUALIZAR TABLA ADMINS
-- ============================================================================
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);

-- Actualizar tipo de role para soportar nuevos roles
ALTER TABLE admins ALTER COLUMN role TYPE VARCHAR(50);

CREATE INDEX idx_admins_tenant ON admins("tenantId");
CREATE INDEX idx_admins_role ON admins(role);

-- ============================================================================
-- 3. RECREAR TABLA LEASES (Contratos de Alquiler)
-- ============================================================================
DROP TABLE IF EXISTS "Leases" CASCADE;
DROP TABLE IF EXISTS leases CASCADE;

CREATE TABLE "Leases" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("propertyId") ON DELETE RESTRICT,
  "landlordId" INTEGER NOT NULL REFERENCES "Clients"("idClient") ON DELETE RESTRICT,
  "renterId" INTEGER NOT NULL REFERENCES "Clients"("idClient") ON DELETE RESTRICT,
  "agentId" INTEGER REFERENCES admins("adminId") ON DELETE SET NULL,
  "startDate" DATE NOT NULL,
  "rentAmount" NUMERIC(12,2) NOT NULL,
  "updateFrequency" VARCHAR(50), -- semestral, cuatrimestral, anual
  "commission" NUMERIC(5,2), -- % comisión inmobiliaria
  "totalMonths" INTEGER NOT NULL,
  "inventory" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active', -- active, terminated
  "pdfPath" VARCHAR(500),
  "customContent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

CREATE INDEX idx_leases_tenant ON "Leases"("tenantId");
CREATE INDEX idx_leases_property ON "Leases"("propertyId");
CREATE INDEX idx_leases_landlord ON "Leases"("landlordId");
CREATE INDEX idx_leases_renter ON "Leases"("renterId");
CREATE INDEX idx_leases_agent ON "Leases"("agentId");
CREATE INDEX idx_leases_status ON "Leases"("status");

-- ============================================================================
-- 4. CREAR TABLA COMMISSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS commissions (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "agentId" INTEGER NOT NULL REFERENCES admins("adminId") ON DELETE RESTRICT,
  "transactionType" VARCHAR(50) NOT NULL, -- LEASE, SALE
  "transactionId" INTEGER NOT NULL,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("propertyId") ON DELETE RESTRICT,
  "clientId" INTEGER REFERENCES "Clients"("idClient") ON DELETE SET NULL,
  "transactionAmount" NUMERIC(12,2) NOT NULL,
  "inmobiliariaCommissionPercent" NUMERIC(5,2),
  "inmobiliariaCommissionAmount" NUMERIC(12,2),
  "agentCommissionPercent" NUMERIC(5,2),
  "agentCommissionAmount" NUMERIC(12,2),
  "status" VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, PAID
  "approvedBy" INTEGER REFERENCES admins("adminId") ON DELETE SET NULL,
  "approvedAt" TIMESTAMP,
  "paidAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commissions_tenant ON commissions("tenantId");
CREATE INDEX idx_commissions_agent ON commissions("agentId");
CREATE INDEX idx_commissions_status ON commissions("status");
CREATE INDEX idx_commissions_type ON commissions("transactionType");

-- ============================================================================
-- 5. AGREGAR tenantId A TABLAS EXISTENTES
-- ============================================================================

-- Clients
ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON "Clients"("tenantId");

-- Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agentId" INTEGER REFERENCES admins("adminId") ON DELETE SET NULL;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "rentalType" VARCHAR(50) DEFAULT 'TRADICIONAL'; -- TRADICIONAL, TEMPORARIO
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "minStayDays" INTEGER;
CREATE INDEX IF NOT EXISTS idx_property_tenant ON "Property"("tenantId");
CREATE INDEX IF NOT EXISTS idx_property_agent ON "Property"("agentId");

-- SaleContracts
ALTER TABLE "SaleContracts" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
ALTER TABLE "SaleContracts" ADD COLUMN IF NOT EXISTS "agentId" INTEGER REFERENCES admins("adminId") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sale_contracts_tenant ON "SaleContracts"("tenantId");
CREATE INDEX IF NOT EXISTS idx_sale_contracts_agent ON "SaleContracts"("agentId");

-- PaymentReceipts (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'PaymentReceipts') THEN
    ALTER TABLE "PaymentReceipts" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payment_receipts_tenant ON "PaymentReceipts"("tenantId");
  END IF;
END $$;

-- Garantors
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Garantors') THEN
    ALTER TABLE "Garantors" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_garantors_tenant ON "Garantors"("tenantId");
  END IF;
END $$;

-- ClientProperties
ALTER TABLE "ClientProperties" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_client_properties_tenant ON "ClientProperties"("tenantId");

-- RentUpdates (si existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'RentUpdates') THEN
    ALTER TABLE "RentUpdates" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_rent_updates_tenant ON "RentUpdates"("tenantId");
  END IF;
END $$;

-- AdminSettings
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'AdminSettings') THEN
    -- Ya tiene tenant_id, solo aseguramos el constraint
    ALTER TABLE "AdminSettings" DROP CONSTRAINT IF EXISTS "AdminSettings_tenant_id_fkey";
    ALTER TABLE "AdminSettings" ADD CONSTRAINT "AdminSettings_tenant_id_fkey" 
      FOREIGN KEY ("tenant_id") REFERENCES tenants("tenantId") ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 6. CREAR TENANT DE PRUEBA Y MIGRAR DATOS EXISTENTES
-- ============================================================================

-- Insertar tenant de prueba (InnoInmobiliaria original)
INSERT INTO tenants (
  "businessName",
  "cuit",
  "subdomain",
  "email",
  "phone",
  "plan",
  "status",
  "maxAgents",
  "maxProperties",
  "features"
) VALUES (
  'InnoInmobiliaria Demo',
  '20-12345678-9',
  'demo',
  'demo@innoinmobiliaria.com',
  '+54 9 11 1234-5678',
  'PROFESSIONAL',
  'ACTIVE',
  10,
  1000,
  '{"whatsapp": true, "ml": true, "reports": true, "contracts": true}'
) ON CONFLICT (subdomain) DO NOTHING
RETURNING "tenantId";

-- Asignar todos los datos existentes al tenant demo (tenantId = 1)
UPDATE admins SET "tenantId" = 1 WHERE "tenantId" IS NULL;
UPDATE "Clients" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
UPDATE "Property" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
UPDATE "SaleContracts" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
UPDATE "ClientProperties" SET "tenantId" = 1 WHERE "tenantId" IS NULL;

-- Actualizar PaymentReceipts si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'PaymentReceipts') THEN
    UPDATE "PaymentReceipts" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- Actualizar Garantors si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Garantors') THEN
    UPDATE "Garantors" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- Actualizar RentUpdates si existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'RentUpdates') THEN
    UPDATE "RentUpdates" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. HACER tenantId NOT NULL (después de migrar datos)
-- ============================================================================

ALTER TABLE admins ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Clients" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Property" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ClientProperties" ALTER COLUMN "tenantId" SET NOT NULL;

-- ============================================================================
-- 8. CREAR VISTAS ÚTILES
-- ============================================================================

-- Vista de resumen de tenants
CREATE OR REPLACE VIEW tenant_summary AS
SELECT 
  t."tenantId",
  t."businessName",
  t."subdomain",
  t."plan",
  t."status",
  COUNT(DISTINCT a."adminId") as total_admins,
  COUNT(DISTINCT c."idClient") as total_clients,
  COUNT(DISTINCT p."propertyId") as total_properties,
  COUNT(DISTINCT l."id") as active_leases,
  COUNT(DISTINCT sc."id") as total_sales
FROM tenants t
LEFT JOIN admins a ON a."tenantId" = t."tenantId"
LEFT JOIN "Clients" c ON c."tenantId" = t."tenantId"
LEFT JOIN "Property" p ON p."tenantId" = t."tenantId"
LEFT JOIN "Leases" l ON l."tenantId" = t."tenantId" AND l."status" = 'active'
LEFT JOIN "SaleContracts" sc ON sc."tenantId" = t."tenantId"
GROUP BY t."tenantId", t."businessName", t."subdomain", t."plan", t."status";

-- Vista de comisiones por agente
CREATE OR REPLACE VIEW agent_commissions_summary AS
SELECT 
  a."adminId",
  a."username",
  a."fullName",
  a."tenantId",
  COUNT(c."id") as total_commissions,
  SUM(CASE WHEN c."status" = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN c."status" = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN c."status" = 'PAID' THEN 1 ELSE 0 END) as paid_count,
  COALESCE(SUM(c."agentCommissionAmount"), 0) as total_earned,
  COALESCE(SUM(CASE WHEN c."status" = 'PAID' THEN c."agentCommissionAmount" ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN c."status" IN ('PENDING', 'APPROVED') THEN c."agentCommissionAmount" ELSE 0 END), 0) as total_pending
FROM admins a
LEFT JOIN commissions c ON c."agentId" = a."adminId"
WHERE a.role = 'AGENT'
GROUP BY a."adminId", a."username", a."fullName", a."tenantId";

COMMIT;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Para verificar:
-- SELECT * FROM tenants;
-- SELECT * FROM tenant_summary;
-- SELECT * FROM agent_commissions_summary;
