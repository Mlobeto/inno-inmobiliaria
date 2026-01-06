-- =========================================
-- FASE 1: Actualizar tabla Clients para compatibilidad
-- =========================================
-- Prepara la tabla Clients para coexistir con client_documents
-- SIN ROMPER funcionalidad actual

BEGIN;

-- 1. Hacer CUIL nullable (ya no será obligatorio)
ALTER TABLE "Clients" 
  ALTER COLUMN cuil DROP NOT NULL;

-- 2. Agregar flag de migración
ALTER TABLE "Clients"
  ADD COLUMN IF NOT EXISTS migrated_to_documents BOOLEAN DEFAULT FALSE;

-- 3. Agregar índice para búsquedas de migración
CREATE INDEX IF NOT EXISTS idx_clients_migration_status 
  ON "Clients"(migrated_to_documents) 
  WHERE migrated_to_documents = FALSE;

-- 4. Agregar comentarios
COMMENT ON COLUMN "Clients".cuil IS 'DEPRECATED: Usar client_documents table. Campo mantenido por compatibilidad';
COMMENT ON COLUMN "Clients".migrated_to_documents IS 'TRUE si el CUIL fue migrado a client_documents';

COMMIT;

-- =========================================
-- Verificación
-- =========================================
SELECT 
  'Clients table updated' AS status,
  COUNT(*) AS total_clients,
  SUM(CASE WHEN cuil IS NOT NULL THEN 1 ELSE 0 END) AS clients_with_cuil,
  SUM(CASE WHEN migrated_to_documents = TRUE THEN 1 ELSE 0 END) AS clients_migrated
FROM "Clients";

-- Ver estructura actualizada
\d "Clients"
