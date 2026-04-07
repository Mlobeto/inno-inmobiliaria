-- Agregar soporte de moneda a la tabla Property
-- Por defecto ARS (Peso Argentino), permite USD para ventas y alquileres temporales

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS';

-- Índice opcional para filtrar por moneda
CREATE INDEX IF NOT EXISTS idx_property_currency ON "Property" ("currency");
