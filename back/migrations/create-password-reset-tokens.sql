-- Migración: Tabla de tokens para recuperación de contraseña
-- Fecha: 2026-01-02

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  "adminId" INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_admin
    FOREIGN KEY ("adminId")
    REFERENCES admins("adminId")
    ON DELETE CASCADE
);

-- Índice para mejorar búsquedas por token
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);

-- Índice para limpiar tokens expirados
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens("expiresAt");

COMMENT ON TABLE password_reset_tokens IS 'Tokens temporales para recuperación de contraseña';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único generado para resetear contraseña';
COMMENT ON COLUMN password_reset_tokens."expiresAt" IS 'Fecha de expiración del token (típicamente 1 hora)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica si el token ya fue usado para cambiar contraseña';
