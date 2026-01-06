-- =====================================================
-- SCRIPT PARA LIMPIAR BASE DE DATOS DE PRODUCCIÓN (NEON)
-- =====================================================
-- IMPORTANTE: Este script elimina TODAS las tablas y datos
-- Asegúrate de hacer un backup antes de ejecutar
-- 
-- Para ejecutar:
-- psql "postgresql://neondb_owner:npg_vxah23FfkesH@ep-dark-voice-adc9yj70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f back/scripts/clean-neon-database.sql

-- Eliminar todas las tablas usando CASCADE (elimina dependencias automáticamente)
-- No necesitamos desactivar foreign keys en Neon, CASCADE lo maneja

-- Nombres con mayúsculas (convención Sequelize)
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
DROP TABLE IF EXISTS "Admins" CASCADE;
DROP TABLE IF EXISTS "Tenants" CASCADE;
DROP TABLE IF EXISTS "Commissions" CASCADE;
DROP TABLE IF EXISTS "SaleContracts" CASCADE;

-- Nombres con minúsculas (tablas antiguas o creadas manualmente)
DROP TABLE IF EXISTS garantors CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS client_properties CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS rent_updates CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS sale_contracts CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS pdf_templates CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS client_documents CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;

-- Verificar tablas restantes
\echo 'Verificando tablas restantes...'
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Mensaje de confirmación
\echo '✅ Base de datos limpiada exitosamente'
\echo ''
\echo '📝 Próximo paso: Ejecutar migraciones'
\echo '   cd back && node index.js (Sequelize creará las tablas automáticamente)'
\echo '   O ejecutar migraciones manualmente si las tienes'
