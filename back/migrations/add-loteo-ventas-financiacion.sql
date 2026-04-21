-- ============================================================
-- Migración: Ventas y Plan de Financiación para Lotes
-- ============================================================

-- 1. Agregar precioBase al modelo de loteos (precio de referencia por lote)
ALTER TABLE loteos ADD COLUMN IF NOT EXISTS "precioBase" FLOAT;

-- 2. Tabla de ventas de lotes (un lote puede tener una venta activa)
CREATE TABLE IF NOT EXISTS lote_ventas (
  id                SERIAL PRIMARY KEY,
  "loteId"          INT NOT NULL,
  "tenantId"        INT NOT NULL,
  "clienteNombre"   VARCHAR(200) NOT NULL,
  "clienteCuil"     VARCHAR(50),
  "clienteTelefono" VARCHAR(50),
  "fechaVenta"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "precioTotal"     FLOAT NOT NULL,
  currency          VARCHAR(10) NOT NULL DEFAULT 'ARS',
  anticipo          FLOAT NOT NULL DEFAULT 0,
  saldo             FLOAT NOT NULL,
  "cantidadCuotas"  INT NOT NULL,
  "montoCuota"      FLOAT NOT NULL,
  interes           FLOAT,
  periodicidad      VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
  notas             TEXT,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("loteId") REFERENCES lotes(id) ON DELETE CASCADE,
  FOREIGN KEY ("tenantId") REFERENCES tenants("tenantId")
);

-- 3. Tabla de cuotas del plan de financiación
CREATE TABLE IF NOT EXISTS lote_cuotas (
  id                  SERIAL PRIMARY KEY,
  "ventaId"           INT NOT NULL,
  "numeroCuota"       INT NOT NULL,
  "fechaVencimiento"  TIMESTAMP NOT NULL,
  monto               FLOAT NOT NULL,
  pagado              BOOLEAN NOT NULL DEFAULT FALSE,
  "fechaPago"         TIMESTAMP,
  notas               TEXT,
  FOREIGN KEY ("ventaId") REFERENCES lote_ventas(id) ON DELETE CASCADE
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_lote_ventas_lote   ON lote_ventas("loteId");
CREATE INDEX IF NOT EXISTS idx_lote_ventas_tenant ON lote_ventas("tenantId");
CREATE INDEX IF NOT EXISTS idx_lote_cuotas_venta  ON lote_cuotas("ventaId");
