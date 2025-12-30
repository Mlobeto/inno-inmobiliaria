-- Migración para renombrar tenantId a renterId
-- Evita confusión con tenant de multi-tenancy (inmobiliaria)

-- 1. Renombrar columna en tabla leases
ALTER TABLE leases RENAME COLUMN "tenantId" TO "renterId";

-- 2. Actualizar comentario
COMMENT ON COLUMN leases."renterId" IS 'ID del inquilino (renter) - renombrado para evitar confusión con tenant multi-tenancy';

-- 3. Verificar índices (si existen)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leases_tenant') THEN
        DROP INDEX idx_leases_tenant;
    END IF;
END$$;

-- 4. Crear nuevo índice con nombre correcto
CREATE INDEX IF NOT EXISTS idx_leases_renter ON leases("renterId");

\echo '✅ Migración completada: tenantId → renterId'
