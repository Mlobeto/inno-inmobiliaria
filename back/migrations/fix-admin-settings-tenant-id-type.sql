-- Migración: Corregir tipo de dato tenant_id en admin_settings
-- Fecha: 2026-01-02
-- Problema: tenant_id era UUID pero debe ser INTEGER para coincidir con tenants.tenantId

BEGIN;

-- 1. Eliminar la columna tenant_id existente (UUID)
ALTER TABLE admin_settings DROP COLUMN IF EXISTS tenant_id;

-- 2. Agregar tenant_id con el tipo correcto (INTEGER)
ALTER TABLE admin_settings 
ADD COLUMN tenant_id INTEGER REFERENCES tenants("tenantId") ON DELETE CASCADE;

-- 3. Recrear el índice
DROP INDEX IF EXISTS idx_admin_settings_tenant;
CREATE INDEX idx_admin_settings_tenant ON admin_settings(tenant_id);

-- 4. Comentario actualizado
COMMENT ON COLUMN admin_settings.tenant_id IS 'ID del tenant (INTEGER, null = configuración global)';

COMMIT;
