-- Migración para crear tabla de configuración de administrador
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  "signatureUrl" VARCHAR(500),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar registro inicial
INSERT INTO admin_settings ("signatureUrl") 
VALUES (NULL)
ON CONFLICT DO NOTHING;
