-- Agregar campo country a la tabla tenants
-- Ejecutar después de tener la tabla tenants creada

BEGIN;

-- Agregar columna country con valor por defecto 'AR' (Argentina)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'AR' NOT NULL;

-- Agregar columna country_config para almacenar configuraciones específicas (opcional)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS country_config JSONB DEFAULT '{}'::jsonb;

-- Agregar comentario a las columnas
COMMENT ON COLUMN tenants.country IS 'Código ISO 3166-1 alpha-2 del país (AR, CL, MX, CO, PE)';
COMMENT ON COLUMN tenants.country_config IS 'Configuraciones específicas del país almacenadas como JSON';

-- Crear índice para búsquedas por país
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);

-- Actualizar todos los tenants existentes a Argentina
UPDATE tenants SET country = 'AR' WHERE country IS NULL;

COMMIT;

-- Verificar
SELECT tenantId, "businessName", country, country_config FROM tenants LIMIT 5;
