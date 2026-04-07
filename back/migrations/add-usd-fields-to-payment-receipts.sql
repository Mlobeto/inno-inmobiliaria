-- Migración: Soporte de pagos en USD con conversión a ARS
-- Los montos siempre se guardan en ARS en el campo `amount`
-- Estas columnas son para auditoría y trazabilidad

ALTER TABLE "PaymentReceipts"
  ADD COLUMN IF NOT EXISTS "originalAmount"   DECIMAL,
  ADD COLUMN IF NOT EXISTS "originalCurrency" VARCHAR(3) DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS "dolarRateUsed"    DECIMAL;

-- Índice para consultas por moneda original
CREATE INDEX IF NOT EXISTS "idx_payment_receipts_currency"
  ON "PaymentReceipts" ("originalCurrency");
