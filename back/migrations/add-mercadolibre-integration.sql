-- ============================================
-- Migración: Integración con MercadoLibre
-- Fecha: 2026-01-06
-- Descripción: Agrega tablas para integración con MercadoLibre
-- ============================================

BEGIN;

-- ============================================
-- Tabla: MercadoLibreConfig
-- Configuración de MercadoLibre por tenant
-- ============================================
CREATE TABLE IF NOT EXISTS "MercadoLibreConfig" (
  id SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "mlUserId" VARCHAR(100),
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT false,
  "lastSync" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_config_tenant ON "MercadoLibreConfig"("tenantId");
CREATE INDEX IF NOT EXISTS idx_ml_config_active ON "MercadoLibreConfig"("isActive");

-- Comentarios
COMMENT ON TABLE "MercadoLibreConfig" IS 'Configuración y tokens de MercadoLibre por tenant';
COMMENT ON COLUMN "MercadoLibreConfig"."mlUserId" IS 'ID del usuario en MercadoLibre';
COMMENT ON COLUMN "MercadoLibreConfig"."accessToken" IS 'Token de acceso OAuth (encriptado)';
COMMENT ON COLUMN "MercadoLibreConfig"."refreshToken" IS 'Token de refresh OAuth (encriptado)';

-- ============================================
-- Tabla: PropertyMLListings
-- Vincula propiedades con publicaciones en ML
-- ============================================
CREATE TABLE IF NOT EXISTS "PropertyMLListings" (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("propertyId") ON DELETE CASCADE,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "mlListingId" VARCHAR(100) NOT NULL,
  "mlStatus" VARCHAR(50), -- active, paused, closed, under_review
  "mlPermalink" TEXT,
  "mlTitle" VARCHAR(255),
  "mlPrice" DECIMAL(15, 2),
  "viewsCount" INTEGER DEFAULT 0,
  "lastSync" TIMESTAMP,
  "syncErrors" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("propertyId", "tenantId")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_listing_property ON "PropertyMLListings"("propertyId");
CREATE INDEX IF NOT EXISTS idx_ml_listing_tenant ON "PropertyMLListings"("tenantId");
CREATE INDEX IF NOT EXISTS idx_ml_listing_status ON "PropertyMLListings"("mlStatus");
CREATE INDEX IF NOT EXISTS idx_ml_listing_id ON "PropertyMLListings"("mlListingId");

-- Comentarios
COMMENT ON TABLE "PropertyMLListings" IS 'Publicaciones de propiedades en MercadoLibre';
COMMENT ON COLUMN "PropertyMLListings"."mlStatus" IS 'Estado en ML: active, paused, closed, under_review';
COMMENT ON COLUMN "PropertyMLListings"."viewsCount" IS 'Cantidad de visitas en ML';

-- ============================================
-- Tabla: MercadoLibreMessages
-- Mensajes y consultas de ML
-- ============================================
CREATE TABLE IF NOT EXISTS "MercadoLibreMessages" (
  id SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "propertyId" INTEGER REFERENCES "Property"("propertyId") ON DELETE SET NULL,
  "mlListingId" VARCHAR(100),
  "mlMessageId" VARCHAR(100) NOT NULL,
  "mlQuestionId" VARCHAR(100),
  "mlUserId" VARCHAR(100),
  "userNickname" VARCHAR(255),
  "message" TEXT NOT NULL,
  "answer" TEXT,
  status VARCHAR(50) DEFAULT 'UNANSWERED', -- UNANSWERED, ANSWERED, DELETED
  "isRead" BOOLEAN DEFAULT false,
  "receivedAt" TIMESTAMP,
  "answeredAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("mlMessageId")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ml_msg_tenant ON "MercadoLibreMessages"("tenantId");
CREATE INDEX IF NOT EXISTS idx_ml_msg_property ON "MercadoLibreMessages"("propertyId");
CREATE INDEX IF NOT EXISTS idx_ml_msg_status ON "MercadoLibreMessages"(status);
CREATE INDEX IF NOT EXISTS idx_ml_msg_read ON "MercadoLibreMessages"("isRead");
CREATE INDEX IF NOT EXISTS idx_ml_msg_received ON "MercadoLibreMessages"("receivedAt");

-- Comentarios
COMMENT ON TABLE "MercadoLibreMessages" IS 'Mensajes y consultas recibidas desde MercadoLibre';
COMMENT ON COLUMN "MercadoLibreMessages".status IS 'Estado: UNANSWERED, ANSWERED, DELETED';

-- ============================================
-- Triggers para updatedAt
-- ============================================
CREATE OR REPLACE FUNCTION update_ml_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ml_config_timestamp
BEFORE UPDATE ON "MercadoLibreConfig"
FOR EACH ROW
EXECUTE FUNCTION update_ml_config_timestamp();

CREATE OR REPLACE FUNCTION update_ml_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ml_listing_timestamp
BEFORE UPDATE ON "PropertyMLListings"
FOR EACH ROW
EXECUTE FUNCTION update_ml_listing_timestamp();

CREATE OR REPLACE FUNCTION update_ml_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ml_message_timestamp
BEFORE UPDATE ON "MercadoLibreMessages"
FOR EACH ROW
EXECUTE FUNCTION update_ml_message_timestamp();

COMMIT;

-- ============================================
-- Verificación
-- ============================================
\echo '✅ Migración completada: Integración MercadoLibre'
\echo ''
\echo 'Tablas creadas:'
\echo '  - MercadoLibreConfig (configuración OAuth por tenant)'
\echo '  - PropertyMLListings (publicaciones en ML)'
\echo '  - MercadoLibreMessages (mensajes y consultas)'
\echo ''
\echo '✅ 3 triggers de updatedAt creados'
\echo ''
\echo 'Próximos pasos:'
\echo '  1. Instalar SDK: npm install mercadolibre'
\echo '  2. Crear modelos Sequelize'
\echo '  3. Implementar MercadoLibreController'
\echo '  4. Registrar rutas en backend'
