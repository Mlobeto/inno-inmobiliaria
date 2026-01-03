-- Crear usuario Platform Admin inicial
-- Fecha: 2026-01-02

-- Password: admin123 (hasheado con bcrypt)
-- IMPORTANTE: Cambiar password en produccion!

INSERT INTO "Admins" (
  "username",
  "password",
  "role",
  "tenantId",
  "createdAt",
  "updatedAt"
) VALUES (
  'platform_admin',
  '$2b$10$rZ5YjKHGQxK5mXY2gC0zHuK7vNH9VxB7O8R5tP2qW8sG1xQ3lN8F6', -- Password: admin123
  'PLATFORM_ADMIN',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("username") DO NOTHING;

-- Verificar creacion
SELECT 
  "adminId",
  "username",
  "role",
  "tenantId",
  "createdAt"
FROM "Admins"
WHERE "username" = 'platform_admin';
