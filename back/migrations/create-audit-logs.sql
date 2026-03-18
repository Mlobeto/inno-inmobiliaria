-- Migración: Crear tabla de audit logs
-- Ejecutar con: psql $DATABASE_URL -f migrations/create-audit-logs.sql
-- O usar: node migrations/runMigrations.js (agregar este archivo a la lista)

-- Tabla de auditoría de acciones del sistema
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,

  -- Contexto de tenant y usuario
  "tenantId"    INTEGER REFERENCES tenants("tenantId") ON DELETE SET NULL,
  "adminId"     INTEGER REFERENCES admins("adminId") ON DELETE SET NULL,

  -- Qué se hizo
  action        VARCHAR(50)  NOT NULL,   -- CREATE | UPDATE | DELETE | LOGIN | LOGOUT | PUBLISH | SUSPEND | ACTIVATE
  resource      VARCHAR(50)  NOT NULL,   -- property | client | tenant | lease | payment | subscription | template | auth
  "resourceId"  VARCHAR(50),             -- ID del recurso afectado

  -- Datos del cambio (JSONB para flexibilidad)
  "oldValues"   JSONB,                   -- Estado previo (para UPDATE/DELETE)
  "newValues"   JSONB,                   -- Estado nuevo  (para CREATE/UPDATE)

  -- Contexto de red
  "ipAddress"   VARCHAR(45),             -- IPv4 o IPv6
  "userAgent"   TEXT,                    -- Navegador / cliente HTTP

  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date
  ON audit_logs ("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_date
  ON audit_logs ("adminId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs (resource, "resourceId");

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action);
