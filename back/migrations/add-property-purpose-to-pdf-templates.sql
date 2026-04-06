-- Migración: Agregar campo propertyPurpose a pdf_templates
-- Permite asociar una plantilla a un tipo de propiedad específico
-- Valores: VIVIENDA, COMERCIAL, TERRENO (NULL = aplica a todos)

ALTER TABLE pdf_templates
ADD COLUMN IF NOT EXISTS "propertyPurpose" VARCHAR(20) DEFAULT NULL;

-- Índice compuesto para búsquedas por tenant + tipo + propósito
CREATE INDEX IF NOT EXISTS "idx_pdf_templates_tenant_type_purpose"
ON pdf_templates ("tenantId", "templateType", "propertyPurpose");
