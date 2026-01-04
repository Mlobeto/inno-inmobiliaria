-- Migración: Hacer tenantId nullable en admins para permitir PLATFORM_ADMIN
-- Fecha: 2026-01-03
-- Platform Admins NO tienen tenantId (debe ser NULL)

BEGIN;

-- 1. Eliminar la restricción NOT NULL de tenantId
ALTER TABLE admins 
ALTER COLUMN "tenantId" DROP NOT NULL;

-- 2. Verificar que la foreign key permita NULL (si no existe, crearla)
ALTER TABLE admins
DROP CONSTRAINT IF EXISTS admins_tenantId_fkey;

ALTER TABLE admins
ADD CONSTRAINT admins_tenantId_fkey
FOREIGN KEY ("tenantId")
REFERENCES tenants("tenantId")
ON DELETE CASCADE;

-- 3. Comentario actualizado
COMMENT ON COLUMN admins."tenantId" IS 'ID del tenant (NULL = PLATFORM_ADMIN sin tenant específico)';

COMMIT;
