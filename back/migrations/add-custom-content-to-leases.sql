-- Agregar columna customContent a tabla Leases
ALTER TABLE "Leases" 
ADD COLUMN IF NOT EXISTS "customContent" TEXT;

COMMENT ON COLUMN "Leases"."customContent" IS 'Contenido HTML personalizado del contrato editado manualmente';
