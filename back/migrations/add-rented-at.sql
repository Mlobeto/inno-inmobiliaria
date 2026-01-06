-- Agregar campo rentedAt para rastrear cuándo se alquiló una propiedad
-- Ejecutar: psql -U postgres -d InnoInmobiliaria_Dev -f migrations/add-rented-at.sql

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS "rentedAt" TIMESTAMP;

COMMENT ON COLUMN properties."rentedAt" IS 'Fecha en que se alquiló la propiedad (para auto-ocultar de landing después de 7 días)';

-- Verificar
SELECT 
    'properties.rentedAt' as campo,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'rentedAt'
    ) as existe;
