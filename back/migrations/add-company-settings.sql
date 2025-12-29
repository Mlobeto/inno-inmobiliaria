-- Migración: Agregar campos de inmobiliaria a admin_settings
-- Fecha: 2025-12-29

-- Agregar nuevos campos
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_cuit VARCHAR(20),
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS contract_footer_text TEXT,
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS additional_config JSONB DEFAULT '{}';

-- Comentarios para documentación
COMMENT ON COLUMN admin_settings.company_name IS 'Nombre de la inmobiliaria';
COMMENT ON COLUMN admin_settings.company_address IS 'Dirección física';
COMMENT ON COLUMN admin_settings.company_phone IS 'Teléfono de contacto';
COMMENT ON COLUMN admin_settings.company_email IS 'Email de contacto';
COMMENT ON COLUMN admin_settings.company_registration IS 'Matrícula o registro profesional';
COMMENT ON COLUMN admin_settings.company_cuit IS 'CUIT de la empresa';
COMMENT ON COLUMN admin_settings.company_logo_url IS 'URL del logo en Cloudinary';
COMMENT ON COLUMN admin_settings.tenant_id IS 'ID del tenant (null = global)';
COMMENT ON COLUMN admin_settings.additional_config IS 'Configuración adicional JSON';

-- Crear índice para tenant_id (para futuro multi-tenant)
CREATE INDEX IF NOT EXISTS idx_admin_settings_tenant ON admin_settings(tenant_id);

-- Insertar configuración inicial si no existe
INSERT INTO admin_settings (
  company_name,
  company_address,
  company_phone,
  company_email,
  company_registration,
  created_at,
  updated_at
)
SELECT 
  'Mi Inmobiliaria',
  'Dirección a completar',
  'Teléfono a completar',
  'email@inmobiliaria.com',
  'Matrícula a completar',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM admin_settings LIMIT 1);
