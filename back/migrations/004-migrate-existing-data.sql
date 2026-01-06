-- =========================================
-- FASE 2: Migrar datos existentes de Clients a client_documents
-- =========================================
-- Este script migra todos los CUILs existentes a la tabla client_documents
-- Mantiene compatibilidad con el campo cuil original

BEGIN;

-- 1. Insertar documentos existentes (CUIL → TAX document)
INSERT INTO client_documents (
  client_id,
  tenant_id,
  document_type,
  country,
  document_code,
  number,
  is_primary,
  is_verified,
  created_at,
  updated_at
)
SELECT 
  c."idClient" AS client_id,
  c."tenantId" AS tenant_id,
  'TAX'::document_type_enum AS document_type,
  'AR' AS country,  -- Todos los clientes actuales son de Argentina
  'CUIL' AS document_code,
  c.cuil AS number,
  TRUE AS is_primary,  -- El CUIL es el documento primario
  FALSE AS is_verified,  -- Requiere verificación manual
  c."createdAt" AS created_at,
  c."updatedAt" AS updated_at
FROM "Clients" c
WHERE 
  c.cuil IS NOT NULL 
  AND c.migrated_to_documents = FALSE
  AND NOT EXISTS (
    -- Evitar duplicados si ya se ejecutó antes
    SELECT 1 FROM client_documents cd 
    WHERE cd.client_id = c."idClient" 
      AND cd.document_code = 'CUIL'
  );

-- 2. Marcar clientes como migrados
UPDATE "Clients" c
SET migrated_to_documents = TRUE
WHERE cuil IS NOT NULL
  AND migrated_to_documents = FALSE
  AND EXISTS (
    SELECT 1 FROM client_documents cd
    WHERE cd.client_id = c."idClient"
      AND cd.document_code = 'CUIL'
  );

-- 3. Reportar resultados
DO $$
DECLARE
  migrated_count INTEGER;
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM "Clients" 
  WHERE migrated_to_documents = TRUE;
  
  SELECT COUNT(*) INTO pending_count 
  FROM "Clients" 
  WHERE migrated_to_documents = FALSE AND cuil IS NOT NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MIGRATION COMPLETED';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Clients migrated: %', migrated_count;
  RAISE NOTICE 'Clients pending: %', pending_count;
  RAISE NOTICE '====================================';
END $$;

COMMIT;

-- =========================================
-- Verificación detallada
-- =========================================

-- Ver resumen de migración
SELECT 
  'Migration Summary' AS report,
  COUNT(*) AS total_clients,
  SUM(CASE WHEN cuil IS NOT NULL THEN 1 ELSE 0 END) AS clients_with_cuil,
  SUM(CASE WHEN migrated_to_documents = TRUE THEN 1 ELSE 0 END) AS migrated,
  SUM(CASE WHEN migrated_to_documents = FALSE AND cuil IS NOT NULL THEN 1 ELSE 0 END) AS pending
FROM "Clients";

-- Ver documentos creados
SELECT 
  'Documents Created' AS report,
  COUNT(*) AS total_documents,
  document_type,
  document_code,
  country,
  COUNT(*) AS count_per_type
FROM client_documents
GROUP BY document_type, document_code, country
ORDER BY document_type, document_code;

-- Ver ejemplos de clientes migrados
SELECT 
  c."idClient",
  c.name,
  c.cuil AS old_cuil,
  cd.document_code,
  cd.number AS new_document_number,
  cd.is_primary,
  c.migrated_to_documents
FROM "Clients" c
LEFT JOIN client_documents cd ON cd.client_id = c."idClient"
WHERE c.migrated_to_documents = TRUE
LIMIT 10;

-- Verificar integridad: Todos los CUILs deben tener un documento
SELECT 
  'Data Integrity Check' AS report,
  COUNT(*) AS clients_with_cuil_but_no_document
FROM "Clients" c
WHERE c.cuil IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_documents cd
    WHERE cd.client_id = c."idClient"
      AND cd.document_code = 'CUIL'
  );
-- Si este query retorna > 0, hay un problema

-- Ver clientes sin documentos (deberían ser los que no tenían CUIL)
SELECT 
  c."idClient",
  c.name,
  c.cuil,
  COUNT(cd.document_id) AS document_count
FROM "Clients" c
LEFT JOIN client_documents cd ON cd.client_id = c."idClient"
GROUP BY c."idClient", c.name, c.cuil
HAVING COUNT(cd.document_id) = 0
ORDER BY c."idClient"
LIMIT 10;
