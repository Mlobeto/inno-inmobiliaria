-- Agregar campo de WhatsApp a la configuración de empresa
-- Este número se usará en la landing page para contacto directo

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_whatsapp VARCHAR(50);

COMMENT ON COLUMN admin_settings.company_whatsapp IS 'Número de WhatsApp de la inmobiliaria (con código de país, ej: +5491112345678)';

-- Verificar que se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND column_name = 'company_whatsapp';
