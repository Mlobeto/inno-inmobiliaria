-- Migración: Agregar rol PLATFORM_ADMIN y hacer tenantId nullable
-- Fecha: 2026-01-02
-- Descripción: Permite crear usuarios PLATFORM_ADMIN (dueños de InnoInmo) sin tenantId

-- 1. Permitir NULL en tenantId de tabla Admins
ALTER TABLE "Admins" 
ALTER COLUMN "tenantId" DROP NOT NULL;

-- 2. Actualizar constraint del enum role para incluir PLATFORM_ADMIN
-- Nota: En PostgreSQL necesitamos agregar el valor al tipo ENUM existente
DO $$ 
BEGIN
    -- Verificar si el tipo existe y agregar el nuevo valor
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Admins_role') THEN
        -- Agregar PLATFORM_ADMIN al enum si no existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'PLATFORM_ADMIN' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Admins_role')
        ) THEN
            ALTER TYPE "enum_Admins_role" ADD VALUE 'PLATFORM_ADMIN';
        END IF;
    END IF;
END $$;

-- 3. Comentarios explicativos
COMMENT ON COLUMN "Admins"."tenantId" IS 'ID del tenant (NULL para PLATFORM_ADMIN, required para SUPER_ADMIN y AGENT)';
COMMENT ON COLUMN "Admins"."role" IS 'PLATFORM_ADMIN: dueño de InnoInmo | SUPER_ADMIN: dueño de inmobiliaria | AGENT: empleado';

-- 4. Verificación
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Admins' 
AND column_name IN ('tenantId', 'role')
ORDER BY ordinal_position;

-- 5. Listar valores del enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Admins_role')
ORDER BY enumsortorder;
