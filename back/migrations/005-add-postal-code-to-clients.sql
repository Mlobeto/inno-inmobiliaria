-- =========================================
-- Agregar campo código postal a Clients
-- =========================================

BEGIN;

-- Agregar columna codigo_postal
ALTER TABLE "Clients" 
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_codigo_postal 
  ON "Clients"(codigo_postal);

-- Agregar comentario
COMMENT ON COLUMN "Clients".codigo_postal IS 'Código postal del domicilio del cliente';

COMMIT;

-- Verificación
SELECT 
  'codigo_postal field added' AS status,
  COUNT(*) AS total_clients,
  COUNT(codigo_postal) AS clients_with_postal_code
FROM "Clients";
