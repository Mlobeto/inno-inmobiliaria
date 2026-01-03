-- Migración: Agregar fullName y email a la tabla Admins
-- Fecha: 2024
-- Descripción: Agrega columnas fullName y email para completar información de administradores

-- Agregar columna fullName
ALTER TABLE "Admins" 
ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255);

-- Agregar columna email
ALTER TABLE "Admins" 
ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);

-- Agregar índice para búsquedas por email
CREATE INDEX IF NOT EXISTS "idx_admins_email" ON "Admins"("email");

-- Comentarios de columnas
COMMENT ON COLUMN "Admins"."fullName" IS 'Nombre completo del administrador';
COMMENT ON COLUMN "Admins"."email" IS 'Email del administrador para notificaciones';

-- Nota: No se hace NOT NULL para no afectar registros existentes
-- Actualizar datos existentes si es necesario después de esta migración
