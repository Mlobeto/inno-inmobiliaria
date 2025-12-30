-- Migración: Sistema de Templates PDF y Firma Digital por Tenant
-- Fecha: 2025-12-30

BEGIN;

-- 1. Agregar campo signatureUrl a tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS "signatureUrl" VARCHAR(500);

COMMENT ON COLUMN tenants."signatureUrl" IS 'URL de la firma digital del tenant almacenada en Cloudinary';

-- 2. Crear tabla pdf_templates
CREATE TABLE IF NOT EXISTS pdf_templates (
  id SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "templateType" VARCHAR(50) NOT NULL CHECK ("templateType" IN ('CONTRATO_ALQUILER', 'AUTORIZACION_VENTA', 'RECIBO_PAGO', 'FICHA_PROPIEDAD', 'ACTUALIZACION_RENTA')),
  "templateName" VARCHAR(100) NOT NULL,
  "htmlTemplate" TEXT NOT NULL,
  styles TEXT,
  "headerHtml" TEXT,
  "footerHtml" TEXT,
  variables JSONB DEFAULT '{}',
  "pageSize" VARCHAR(20) NOT NULL DEFAULT 'A4',
  orientation VARCHAR(20) NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  margins JSONB DEFAULT '{"top": "20mm", "right": "15mm", "bottom": "20mm", "left": "15mm"}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" INTEGER REFERENCES admins("adminId") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- 3. Comentarios en columnas
COMMENT ON TABLE pdf_templates IS 'Templates personalizables para generación de PDFs por tenant';
COMMENT ON COLUMN pdf_templates."tenantId" IS 'Inmobiliaria a la que pertenece el template';
COMMENT ON COLUMN pdf_templates."templateType" IS 'Tipo de documento PDF';
COMMENT ON COLUMN pdf_templates."templateName" IS 'Nombre descriptivo del template';
COMMENT ON COLUMN pdf_templates."htmlTemplate" IS 'Template HTML con variables Handlebars {{variable}}';
COMMENT ON COLUMN pdf_templates.styles IS 'CSS personalizado para el template';
COMMENT ON COLUMN pdf_templates."headerHtml" IS 'HTML para el encabezado (logo, datos de inmobiliaria)';
COMMENT ON COLUMN pdf_templates."footerHtml" IS 'HTML para el pie de página';
COMMENT ON COLUMN pdf_templates.variables IS 'Descripción de variables disponibles y valores por defecto';
COMMENT ON COLUMN pdf_templates."pageSize" IS 'Tamaño de página: A4, Letter, Legal';
COMMENT ON COLUMN pdf_templates.orientation IS 'Orientación del PDF: portrait o landscape';
COMMENT ON COLUMN pdf_templates.margins IS 'Márgenes del PDF';
COMMENT ON COLUMN pdf_templates."isActive" IS 'Si está activo para uso';
COMMENT ON COLUMN pdf_templates."isDefault" IS 'Si es el template por defecto para este tipo';
COMMENT ON COLUMN pdf_templates."createdBy" IS 'Admin que creó el template';

-- 4. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pdf_templates_tenant_type 
ON pdf_templates("tenantId", "templateType");

CREATE INDEX IF NOT EXISTS idx_pdf_templates_tenant_default 
ON pdf_templates("tenantId", "isDefault");

CREATE INDEX IF NOT EXISTS idx_pdf_templates_active 
ON pdf_templates("isActive");

-- 5. Trigger para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_pdf_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdf_templates_update_timestamp
BEFORE UPDATE ON pdf_templates
FOR EACH ROW
EXECUTE FUNCTION update_pdf_templates_timestamp();

COMMIT;

-- Verificación
SELECT 'Migración completada exitosamente' AS status;
SELECT 'Tabla pdf_templates creada' AS info;
SELECT 'Campo signatureUrl agregado a tenants' AS info;
