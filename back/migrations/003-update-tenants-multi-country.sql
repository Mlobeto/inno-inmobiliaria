-- =========================================
-- FASE 1: Actualizar tabla tenants para multi-país
-- =========================================
-- Agrega campos genéricos para soportar múltiples países
-- SIN ROMPER funcionalidad actual

BEGIN;

-- 1. Agregar campo country (país del tenant)
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'AR' NOT NULL;

-- 2. Agregar campos genéricos de documentos
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS company_document VARCHAR(50),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS real_estate_license VARCHAR(50),
  ADD COLUMN IF NOT EXISTS license_required BOOLEAN DEFAULT TRUE;

-- 3. Agregar campo JSONB para configuraciones por país
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS country_config JSONB DEFAULT '{}'::jsonb;

-- 4. Migrar datos existentes de CUIT → company_document
UPDATE tenants 
SET 
  company_document = cuit,
  document_type = 'CUIT',
  country = 'AR'
WHERE cuit IS NOT NULL AND company_document IS NULL;

-- 5. No hay columna matricula en la tabla actual, por lo que no se migra
-- Si en el futuro se agrega, descomentar:
-- UPDATE tenants
-- SET 
--   real_estate_license = matricula,
--   license_required = TRUE
-- WHERE matricula IS NOT NULL AND real_estate_license IS NULL;

-- 6. Crear índice para búsquedas por país
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);

-- 7. Agregar comentarios
COMMENT ON COLUMN tenants.country IS 'Código ISO 3166-1 alpha-2 del país (AR, BR, CL, CO, EC, MX, PE, UY)';
COMMENT ON COLUMN tenants.company_document IS 'Documento fiscal de la empresa (CUIT, CNPJ, RFC, NIT, RUC, etc.)';
COMMENT ON COLUMN tenants.document_type IS 'Tipo de documento: CUIT, CNPJ, RFC, NIT, RUC, RUT';
COMMENT ON COLUMN tenants.real_estate_license IS 'Número de matrícula/licencia inmobiliaria (si aplica)';
COMMENT ON COLUMN tenants.license_required IS 'TRUE si el país requiere matrícula obligatoria';
COMMENT ON COLUMN tenants.country_config IS 'Configuraciones específicas del país en formato JSON';

COMMENT ON COLUMN tenants.cuit IS 'DEPRECATED: Usar company_document. Mantenido por compatibilidad';

COMMIT;

-- =========================================
-- Verificación
-- =========================================
SELECT 
  'Tenants table updated' AS status,
  COUNT(*) AS total_tenants,
  COUNT(DISTINCT country) AS countries_count,
  country,
  COUNT(*) AS tenants_per_country
FROM tenants
GROUP BY country
ORDER BY country;

-- Ver ejemplos migrados
SELECT 
  "tenantId",
  "businessName",
  country,
  cuit AS old_cuit,
  company_document AS new_company_document,
  document_type,
  real_estate_license AS new_license
FROM tenants
LIMIT 5;

-- Verificar que no hay datos perdidos
SELECT 
  COUNT(*) AS tenants_with_cuit_but_no_company_doc
FROM tenants
WHERE cuit IS NOT NULL AND company_document IS NULL;
