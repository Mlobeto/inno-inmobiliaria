-- Migración: Agregar tenantId a tablas restantes para soporte multitenant completo
-- Fecha: 2026-01-02
-- Descripción: Agrega columna tenantId con FK a tenants y crea índices para optimización

-- 1. Tabla garantors
ALTER TABLE garantors 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

ALTER TABLE garantors
ADD CONSTRAINT fk_garantors_tenant 
FOREIGN KEY ("tenantId") 
REFERENCES tenants("tenantId") 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_garantors_tenantId 
ON garantors("tenantId");

-- 2. Tabla payment_receipts
ALTER TABLE payment_receipts 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

ALTER TABLE payment_receipts
ADD CONSTRAINT fk_payment_receipts_tenant 
FOREIGN KEY ("tenantId") 
REFERENCES tenants("tenantId") 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_receipts_tenantId 
ON payment_receipts("tenantId");

-- 3. Tabla rent_updates
ALTER TABLE rent_updates 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

ALTER TABLE rent_updates
ADD CONSTRAINT fk_rent_updates_tenant 
FOREIGN KEY ("tenantId") 
REFERENCES tenants("tenantId") 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_rent_updates_tenantId 
ON rent_updates("tenantId");

-- 4. Tabla sale_contracts
ALTER TABLE sale_contracts 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

ALTER TABLE sale_contracts
ADD CONSTRAINT fk_sale_contracts_tenant 
FOREIGN KEY ("tenantId") 
REFERENCES tenants("tenantId") 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sale_contracts_tenantId 
ON sale_contracts("tenantId");

-- 5. Tabla admin_settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

ALTER TABLE admin_settings
ADD CONSTRAINT fk_admin_settings_tenant 
FOREIGN KEY ("tenantId") 
REFERENCES tenants("tenantId") 
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_admin_settings_tenantId 
ON admin_settings("tenantId");

-- Verificación: Mostrar todas las tablas con tenantId
SELECT 
    table_name, 
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'tenantId' 
ORDER BY table_name;
