-- Método de pago elegido por el inquilino al informar transferencia
ALTER TABLE "PaymentReceipts"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" INTEGER;

ALTER TABLE "PaymentReceipts"
  DROP CONSTRAINT IF EXISTS "PaymentReceipts_paymentMethodId_fkey";

ALTER TABLE "PaymentReceipts"
  ADD CONSTRAINT "PaymentReceipts_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethods"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "idx_payment_receipts_payment_method"
  ON "PaymentReceipts"("paymentMethodId");
