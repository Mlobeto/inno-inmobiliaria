-- Migración completa para Landing Pages
-- Ejecutar: psql -U postgres -d InnoInmobiliaria_Dev -f migrations/add-landing-features.sql

-- 1. Agregar campo isPublishedInLanding a properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS "isPublishedInLanding" BOOLEAN DEFAULT false;

COMMENT ON COLUMN properties."isPublishedInLanding" IS 'Si la propiedad está visible en la landing page pública del tenant';

-- 2. Agregar campo company_whatsapp a admin_settings  
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_whatsapp VARCHAR(50);

COMMENT ON COLUMN admin_settings.company_whatsapp IS 'Número de WhatsApp para contacto en landing (formato: +5491112345678)';

-- 3. Crear índice para búsquedas en landing
CREATE INDEX IF NOT EXISTS idx_properties_published_landing 
ON properties ("isPublishedInLanding", "tenantId") 
WHERE "isPublishedInLanding" = true;

-- Verificar cambios
SELECT 
    'properties.isPublishedInLanding' as campo,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'isPublishedInLanding'
    ) as existe
UNION ALL
SELECT 
    'admin_settings.company_whatsapp',
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_settings' 
        AND column_name = 'company_whatsapp'
    );
