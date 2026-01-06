-- Agregar campos para recibos a admin_settings
-- Fecha: 2026-01-06

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS company_ingresos_brutos VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_condicion_iva VARCHAR(255) DEFAULT 'RESPONSABLE MONOTRIBUTO',
ADD COLUMN IF NOT EXISTS company_inicio_actividad VARCHAR(255),
ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(1) DEFAULT 'X',
ADD COLUMN IF NOT EXISTS receipt_footer_text TEXT;

-- Actualizar registros existentes con valores por defecto
UPDATE admin_settings 
SET company_condicion_iva = 'RESPONSABLE MONOTRIBUTO',
    receipt_prefix = 'X'
WHERE company_condicion_iva IS NULL OR receipt_prefix IS NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN admin_settings.company_ingresos_brutos IS 'Número de Ingresos Brutos';
COMMENT ON COLUMN admin_settings.company_condicion_iva IS 'Condición ante IVA (ej: RESPONSABLE MONOTRIBUTO, RESPONSABLE INSCRIPTO)';
COMMENT ON COLUMN admin_settings.company_inicio_actividad IS 'Fecha de inicio de actividades (formato: DD-MM-YYYY)';
COMMENT ON COLUMN admin_settings.professional_title IS 'Título profesional (ej: ARQUITECTA, MARTILLERO PÚBLICO)';
COMMENT ON COLUMN admin_settings.receipt_prefix IS 'Prefijo del recibo: A, B, C o X';
COMMENT ON COLUMN admin_settings.receipt_footer_text IS 'Texto adicional para pie de recibos';
