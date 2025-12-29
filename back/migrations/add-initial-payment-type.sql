-- Migración: Agregar tipo de pago "initial" (Inicial Contrato Alquiler)
-- Fecha: 2025-11-15
-- Descripción: Permite registrar un pago inicial único por contrato de alquiler

-- 1. Modificar el tipo ENUM para agregar "initial"
ALTER TYPE "enum_PaymentReceipts_type" ADD VALUE IF NOT EXISTS 'initial';

-- 2. Hacer que installmentNumber y totalInstallments sean opcionales (nullable)
ALTER TABLE "PaymentReceipts" 
  ALTER COLUMN "installmentNumber" DROP NOT NULL;

ALTER TABLE "PaymentReceipts" 
  ALTER COLUMN "totalInstallments" DROP NOT NULL;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN "PaymentReceipts"."type" IS 'Tipo de pago: installment (cuota mensual), commission (comisión), initial (pago inicial del contrato)';
COMMENT ON COLUMN "PaymentReceipts"."installmentNumber" IS 'Número de cuota (solo para type=installment)';
COMMENT ON COLUMN "PaymentReceipts"."totalInstallments" IS 'Total de cuotas (solo para type=installment)';
