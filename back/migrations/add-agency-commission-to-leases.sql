-- Migration: agency commission fields on Leases
-- agencyCommissionType: 'months' | 'amount'
-- agencyCommissionValue: number of months OR fixed ARS amount

ALTER TABLE "Leases"
  ADD COLUMN IF NOT EXISTS "agencyCommissionType"  VARCHAR(10),
  ADD COLUMN IF NOT EXISTS "agencyCommissionValue" DECIMAL;
