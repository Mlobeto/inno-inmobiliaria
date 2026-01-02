-- Script para crear usuario PLATFORM_ADMIN
-- Ejecutar DESPUÉS de tener la aplicación configurada
-- Reemplaza los valores con tus datos reales

-- IMPORTANTE: Este usuario NO debe tener tenantId (será NULL)
-- Asegúrate de cambiar la contraseña después del primer login

INSERT INTO "Admins" (
  "tenantId",
  "username", 
  "password", 
  "fullName", 
  "email", 
  "role",
  "createdAt"
) VALUES (
  NULL,                                    -- NULL para PLATFORM_ADMIN
  'platform_admin',                        -- Tu username
  '$2b$10$HASH_AQUI',                     -- CAMBIAR: Hash de tu contraseña (usa bcrypt)
  'Mercedes - InnoInmo Owner',             -- Tu nombre completo
  'tu_email@ejemplo.com',                  -- Tu email
  'PLATFORM_ADMIN',                        -- Rol de super admin de plataforma
  NOW()
) RETURNING "adminId", "username", "email", "role", "tenantId";

-- Verificar que se creó correctamente
SELECT 
  "adminId",
  "username",
  "fullName",
  "email",
  "role",
  "tenantId",
  "createdAt"
FROM "Admins"
WHERE role = 'PLATFORM_ADMIN';

-- Notas:
-- 1. Para generar el hash de la contraseña, puedes usar:
--    En Node.js: const bcrypt = require('bcrypt'); const hash = await bcrypt.hash('tu_password', 10);
-- 2. O ejecuta este script desde el backend con un endpoint temporal
-- 3. Asegúrate de agregar tu email a la variable de entorno: PLATFORM_ADMIN_EMAILS=tu_email@ejemplo.com
