-- =====================================================
-- SCRIPT PARA LIMPIAR BASE DE DATOS DE PRODUCCIÓN
-- =====================================================
-- IMPORTANTE: Este script elimina TODAS las tablas y datos
-- Asegúrate de hacer un backup antes de ejecutar
-- 
-- Para ejecutar:
-- psql "postgresql://neondb_owner:npg_vxah23FfkesH@ep-dark-voice-adc9yj70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f clean-production-database.sql

-- 1. Desactivar foreign key checks temporalmente
SET session_replication_role = 'replica';

-- 2. Eliminar todas las tablas en orden correcto
DROP TABLE IF EXISTS "ClientDocuments" CASCADE;
DROP TABLE IF EXISTS "ClientProperties" CASCADE;
DROP TABLE IF EXISTS "PropertyImages" CASCADE;
DROP TABLE IF EXISTS "Garantors" CASCADE;
DROP TABLE IF EXISTS "PaymentReceipts" CASCADE;
DROP TABLE IF EXISTS "RentUpdates" CASCADE;
DROP TABLE IF EXISTS "Leases" CASCADE;
DROP TABLE IF EXISTS "Clients" CASCADE;
DROP TABLE IF EXISTS "Property" CASCADE;
DROP TABLE IF EXISTS "PdfTemplates" CASCADE;
DROP TABLE IF EXISTS "Subscriptions" CASCADE;
DROP TABLE IF EXISTS "Plans" CASCADE;
DROP TABLE IF EXISTS "AdminSettings" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "Tenants" CASCADE;

-- 3. Reactivar foreign key checks
SET session_replication_role = 'origin';

-- 4. Verificar que no queden tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Base de datos limpiada exitosamente';
    RAISE NOTICE 'Ahora ejecuta las migraciones en orden:';
    RAISE NOTICE '1. 000-create-database-dev.sql';
    RAISE NOTICE '2. 001-create-schema.sql';
    RAISE NOTICE '3. Todas las demás migraciones...';
END $$;
