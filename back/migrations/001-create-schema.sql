-- Script para exportar SCHEMA de la BD actual (sin datos)
-- Ejecutar DESDE la BD de producción para obtener la estructura

-- Para ejecutar en terminal:
-- pg_dump -U postgres -d InnoInmobiliaria --schema-only --no-owner --no-privileges -f back/migrations/001-schema-from-production.sql

-- O si prefieres hacerlo manualmente, este script genera el DDL:

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla: admins (usuarios del sistema)
CREATE TABLE IF NOT EXISTS admins (
  "adminId" SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Tabla: clients (clientes)
CREATE TABLE IF NOT EXISTS clients (
  "idClient" SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  dni VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  nationality VARCHAR(100),
  "maritalStatus" VARCHAR(50),
  profession VARCHAR(100),
  "birthDate" DATE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Tabla: properties (propiedades)
CREATE TABLE IF NOT EXISTS properties (
  "propertyId" SERIAL PRIMARY KEY,
  title VARCHAR(255),
  address TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('venta', 'alquiler')),
  status VARCHAR(50) DEFAULT 'available',
  price DECIMAL(12, 2),
  description TEXT,
  images TEXT[],
  surface DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  garages INTEGER,
  amenities TEXT[],
  location JSONB,
  "is_published" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Tabla: client_properties (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS client_properties (
  "idClient" INTEGER REFERENCES clients("idClient") ON DELETE CASCADE,
  "propertyId" INTEGER REFERENCES properties("propertyId") ON DELETE CASCADE,
  role VARCHAR(50),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("idClient", "propertyId")
);

-- Tabla: leases (contratos de alquiler)
CREATE TABLE IF NOT EXISTS leases (
  "leaseId" SERIAL PRIMARY KEY,
  "propertyId" INTEGER REFERENCES properties("propertyId") ON DELETE CASCADE,
  "clientId" INTEGER REFERENCES clients("idClient") ON DELETE CASCADE,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "monthlyRent" DECIMAL(12, 2) NOT NULL,
  "depositAmount" DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'active',
  "customContent" TEXT,
  "initialPaymentType" VARCHAR(20),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP WITH TIME ZONE
);

-- Tabla: garantors (garantes)
CREATE TABLE IF NOT EXISTS garantors (
  "garantorId" SERIAL PRIMARY KEY,
  "leaseId" INTEGER REFERENCES leases("leaseId") ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dni VARCHAR(20),
  phone VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  relationship VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: payment_receipts (recibos de pago)
CREATE TABLE IF NOT EXISTS payment_receipts (
  "receiptId" SERIAL PRIMARY KEY,
  "leaseId" INTEGER REFERENCES leases("leaseId") ON DELETE CASCADE,
  "clientId" INTEGER REFERENCES clients("idClient") ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  "paymentDate" DATE NOT NULL,
  "paymentMethod" VARCHAR(50),
  "receiptNumber" VARCHAR(100),
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: rent_updates (actualizaciones de alquiler)
CREATE TABLE IF NOT EXISTS rent_updates (
  id SERIAL PRIMARY KEY,
  "leaseId" INTEGER REFERENCES leases("leaseId") ON DELETE CASCADE,
  "oldAmount" DECIMAL(12, 2) NOT NULL,
  "newAmount" DECIMAL(12, 2) NOT NULL,
  "updateDate" DATE NOT NULL,
  "appliedAt" TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: sale_contracts (contratos de venta)
CREATE TABLE IF NOT EXISTS sale_contracts (
  id SERIAL PRIMARY KEY,
  "propertyId" INTEGER REFERENCES properties("propertyId") ON DELETE CASCADE,
  "buyerId" INTEGER REFERENCES clients("idClient") ON DELETE CASCADE,
  "sellerId" INTEGER REFERENCES clients("idClient") ON DELETE CASCADE,
  "salePrice" DECIMAL(12, 2) NOT NULL,
  "saleDate" DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla: admin_settings (configuración del sistema)
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  "signatureUrl" TEXT,
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_registration VARCHAR(100),
  company_cuit VARCHAR(20),
  company_logo_url TEXT,
  contract_footer_text TEXT,
  tenant_id UUID,
  additional_config JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_leases_property ON leases("propertyId");
CREATE INDEX IF NOT EXISTS idx_leases_client ON leases("clientId");
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_lease ON payment_receipts("leaseId");
CREATE INDEX IF NOT EXISTS idx_payment_receipts_date ON payment_receipts("paymentDate");
CREATE INDEX IF NOT EXISTS idx_admin_settings_tenant ON admin_settings(tenant_id);

-- ============================================
-- DATOS INICIALES (SEED)
-- ============================================

-- Insertar admin por defecto (password: admin123 - cambiar en producción)
INSERT INTO admins (username, password, role, "createdAt", "updatedAt")
VALUES 
  ('admin', '$2b$10$hashed_password_aqui', 'admin', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insertar configuración inicial
INSERT INTO admin_settings (
  company_name,
  company_address,
  company_phone,
  company_email,
  "createdAt",
  "updatedAt"
)
VALUES (
  'Mi Inmobiliaria',
  'Completar dirección',
  'Completar teléfono',
  'completar@email.com',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE admins IS 'Usuarios administradores del sistema';
COMMENT ON TABLE clients IS 'Clientes (propietarios, inquilinos, compradores)';
COMMENT ON TABLE properties IS 'Propiedades en venta o alquiler';
COMMENT ON TABLE leases IS 'Contratos de alquiler';
COMMENT ON TABLE payment_receipts IS 'Recibos de pago de alquileres';
COMMENT ON TABLE admin_settings IS 'Configuración de la inmobiliaria';

\echo '✅ Schema creado exitosamente'
\echo '📋 Tablas creadas: admins, clients, properties, leases, garantors, payments, etc.'
