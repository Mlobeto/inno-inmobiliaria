-- Migración: Eliminar tabla duplicada Admins (con mayúscula)
-- Fecha: 2026-01-04
-- La tabla correcta es "admins" (minúscula)

BEGIN;

-- 1. Eliminar tabla Admins (con mayúscula) y todas sus dependencias
DROP TABLE IF EXISTS "Admins" CASCADE;

-- 2. Verificar que solo existe la tabla admins (minúscula)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%admin%'
ORDER BY table_name;

COMMIT;
