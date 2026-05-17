-- Migration: add owner settlements (liquidaciones al propietario)
-- Run once against the production database

CREATE TABLE IF NOT EXISTS "OwnerSettlements" (
  "id"                SERIAL PRIMARY KEY,
  "tenantId"          INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "leaseId"           INTEGER NOT NULL REFERENCES "Leases"("id") ON DELETE CASCADE,
  "paymentReceiptId"  INTEGER NOT NULL REFERENCES "PaymentReceipts"("id") ON DELETE CASCADE,
  "landlordId"        INTEGER NOT NULL REFERENCES "Clients"("idClient") ON DELETE CASCADE,
  "landlordName"      VARCHAR(255) NOT NULL,
  "propertyId"        INTEGER NOT NULL,
  "propertyAddress"   VARCHAR(500) NOT NULL,
  "grossAmount"       DECIMAL NOT NULL,          -- lo que pagó el inquilino (en ARS)
  "commissionPct"     DECIMAL(5,2) NOT NULL,     -- % copiado del contrato
  "commissionAmt"     DECIMAL NOT NULL,          -- grossAmount × commissionPct / 100
  "netAmount"         DECIMAL NOT NULL,          -- grossAmount - commissionAmt
  "currency"          VARCHAR(3) NOT NULL DEFAULT 'ARS',
  "originalAmount"    DECIMAL,                   -- si el pago fue en USD
  "originalCurrency"  VARCHAR(3) DEFAULT 'ARS',
  "dolarRateUsed"     DECIMAL,
  "period"            VARCHAR(255) NOT NULL,
  "status"            VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | liquidated
  "liquidatedAt"      TIMESTAMPTZ,
  "liquidationNote"   TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_owner_settlements_tenant"   ON "OwnerSettlements"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_owner_settlements_landlord" ON "OwnerSettlements"("landlordId");
CREATE INDEX IF NOT EXISTS "idx_owner_settlements_lease"    ON "OwnerSettlements"("leaseId");
CREATE INDEX IF NOT EXISTS "idx_owner_settlements_status"   ON "OwnerSettlements"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_owner_settlements_receipt_unique"
  ON "OwnerSettlements"("paymentReceiptId"); -- una liquidación por cuota
