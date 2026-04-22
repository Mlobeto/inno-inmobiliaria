-- Permitir propertyId null en commissions (para ventas de lotes que no son Property)
ALTER TABLE commissions ALTER COLUMN "propertyId" DROP NOT NULL;

-- Vincular comisiones con ventas de lotes
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "loteVentaId" INT REFERENCES lote_ventas(id) ON DELETE SET NULL;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS "loteoNombre" VARCHAR(200);

-- Guardar datos de comisión directamente en lote_ventas
ALTER TABLE lote_ventas ADD COLUMN IF NOT EXISTS "comisionPercent" FLOAT;
ALTER TABLE lote_ventas ADD COLUMN IF NOT EXISTS "comisionMonto"   FLOAT;
