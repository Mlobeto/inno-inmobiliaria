-- Agregar campos city y province a admin_settings
-- Fecha: 2026-01-06

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_province VARCHAR(255);

-- Actualizar registros existentes con valores por defecto si es necesario
UPDATE admin_settings 
SET company_city = 'Belén',
    company_province = 'Catamarca'
WHERE company_city IS NULL AND company_province IS NULL;

COMMENT ON COLUMN admin_settings.company_city IS 'Ciudad de la inmobiliaria';
COMMENT ON COLUMN admin_settings.company_province IS 'Provincia de la inmobiliaria';
