-- Los pagos registrados manualmente por el admin (sin comprobante de inquilino)
-- debían quedar como 'paid' desde el inicio. Corregimos los existentes.
UPDATE "PaymentReceipts"
SET
  status  = 'paid',
  "paidAt" = "paymentDate"
WHERE
  status      = 'pending'
  AND "voucherUrl" IS NULL     -- sin comprobante cargado por inquilino
  AND "deletedAt" IS NULL;
