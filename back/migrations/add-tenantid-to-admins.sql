-- Migracion: Agregar tenantId a tabla Admins para soporte multitenant
-- Fecha: 2026-01-02

-- 1. Agregar columna tenantId (nullable para PLATFORM_ADMIN)
ALTER TABLE "Admins" 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

-- 2. Agregar foreign key a tenants (con ON DELETE CASCADE)
ALTER TABLE "Admins"
ADD CONSTRAINT fk_admin_tenant
FOREIGN KEY ("tenantId")
REFERENCES tenants("tenantId")
ON DELETE CASCADE;

-- 3. Crear indice para mejorar busquedas
CREATE INDEX IF NOT EXISTS idx_admins_tenant 
ON "Admins"("tenantId");

-- 4. Comentarios para documentacion
COMMENT ON COLUMN "Admins"."tenantId" IS 
'ID del tenant (inmobiliaria) al que pertenece el admin. NULL = PLATFORM_ADMIN (administrador de plataforma)';

-- 5. IMPORTANTE: Verificar que el platform_admin tenga tenantId NULL
UPDATE "Admins" 
SET "tenantId" = NULL 
WHERE "role" = 'PLATFORM_ADMIN';

-- 6. Verificar resultado
SELECT 
  "adminId", 
  "username", 
  "role", 
  "tenantId",
  CASE 
    WHEN "tenantId" IS NULL THEN 'Platform Admin'
    ELSE 'Tenant Admin'
  END as "admin_type"
FROM "Admins"
ORDER BY "tenantId" NULLS FIRST;
