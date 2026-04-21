-- Agregar campo parcela a la tabla lotes
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS parcela VARCHAR(100);
