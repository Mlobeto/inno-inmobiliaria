-- Tablas legacy sin uso en la app (modelos @@ignore). La app usa "Clients", "Property", "PaymentReceipts", "Garantors", "RentUpdates", "SaleContracts", etc.
-- Solo datos de prueba: se eliminan con CASCADE por si quedan FKs internas.

DROP TABLE IF EXISTS "sale_contracts" CASCADE;
DROP TABLE IF EXISTS "client_properties" CASCADE;
DROP TABLE IF EXISTS "payment_receipts" CASCADE;
DROP TABLE IF EXISTS "rent_updates" CASCADE;
DROP TABLE IF EXISTS "garantors" CASCADE;
DROP TABLE IF EXISTS "properties" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
