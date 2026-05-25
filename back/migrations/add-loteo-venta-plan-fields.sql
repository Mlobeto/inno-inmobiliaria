-- Día de vencimiento por defecto y modo de plan en ventas de lote
ALTER TABLE lote_ventas ADD COLUMN IF NOT EXISTS "diaVencimiento" INT DEFAULT 10;
ALTER TABLE lote_ventas ADD COLUMN IF NOT EXISTS "modoPlan" VARCHAR(20) DEFAULT 'PERIODICO';
