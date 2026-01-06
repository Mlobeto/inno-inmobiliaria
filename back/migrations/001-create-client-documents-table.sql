-- =========================================
-- FASE 1: Crear tabla client_documents
-- =========================================
-- Esta migración crea la nueva tabla para almacenar
-- múltiples documentos por cliente (identidad, fiscal, etc.)
-- SIN ROMPER la funcionalidad actual

BEGIN;

-- 1. Crear ENUM para tipos de documento
CREATE TYPE document_type_enum AS ENUM (
  'IDENTITY',   -- Documento de identidad (DNI, RG, Cédula)
  'TAX',        -- Documento fiscal (CUIL, CPF, RUT, RFC)
  'PROPERTY',   -- Documentos de propiedad
  'INCOME',     -- Comprobantes de ingresos
  'GUARANTEE',  -- Documentos de garantía
  'OTHER'       -- Otros documentos
);

-- 2. Crear tabla client_documents
CREATE TABLE IF NOT EXISTS client_documents (
  document_id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  
  -- Tipo y clasificación
  document_type document_type_enum NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'AR',
  document_code VARCHAR(20) NOT NULL,  -- CUIL, DNI, CPF, RUT, etc.
  number VARCHAR(50) NOT NULL,
  
  -- Información adicional
  issued_by VARCHAR(100),
  issued_at DATE,
  expires_at DATE,
  
  -- Control y flags
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata flexible (JSONB)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,  -- Soft delete
  
  -- Foreign Keys
  CONSTRAINT fk_client_documents_client 
    FOREIGN KEY (client_id) REFERENCES "Clients"("idClient") ON DELETE CASCADE,
  
  CONSTRAINT fk_client_documents_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants("tenantId") ON DELETE CASCADE,
  
  -- Constraint: Un cliente puede tener varios documentos, pero solo uno de cada tipo+código debe ser primario
  CONSTRAINT unique_primary_doc_per_type 
    UNIQUE (client_id, document_type, document_code, is_primary) 
    DEFERRABLE INITIALLY DEFERRED
);

-- 3. Crear índices para performance
CREATE INDEX idx_client_documents_client ON client_documents(client_id);
CREATE INDEX idx_client_documents_tenant ON client_documents(tenant_id);
CREATE INDEX idx_client_documents_primary ON client_documents(client_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_client_documents_type ON client_documents(document_type);
CREATE INDEX idx_client_documents_country ON client_documents(country);

-- 4. Agregar comentarios
COMMENT ON TABLE client_documents IS 'Almacena múltiples documentos por cliente (identidad, fiscal, etc.) para soporte multi-país';
COMMENT ON COLUMN client_documents.document_type IS 'Tipo: IDENTITY (DNI), TAX (CUIL/CUIT), PROPERTY, INCOME, GUARANTEE, OTHER';
COMMENT ON COLUMN client_documents.country IS 'Código ISO 3166-1 alpha-2 del país emisor (AR, BR, CL, etc.)';
COMMENT ON COLUMN client_documents.document_code IS 'Código específico del documento: CUIL, DNI, CPF, RUT, RFC, NIT, etc.';
COMMENT ON COLUMN client_documents.number IS 'Número del documento con formato del país';
COMMENT ON COLUMN client_documents.is_primary IS 'TRUE si es el documento principal del cliente para este tipo';
COMMENT ON COLUMN client_documents.metadata IS 'Campo JSON para almacenar datos adicionales específicos por país';

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_client_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_documents_timestamp
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_client_documents_updated_at();

COMMIT;

-- =========================================
-- Verificación
-- =========================================
SELECT 
  'client_documents table created' AS status,
  COUNT(*) AS row_count 
FROM client_documents;

-- Listar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'client_documents'
ORDER BY indexname;

-- Verificar ENUM
SELECT 
  enumlabel 
FROM pg_enum 
WHERE enumtypid = 'document_type_enum'::regtype
ORDER BY enumlabel;
