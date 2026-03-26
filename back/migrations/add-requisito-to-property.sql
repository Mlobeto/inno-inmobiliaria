-- Agregar campo requisito a la tabla Property
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "requisito" TEXT;
