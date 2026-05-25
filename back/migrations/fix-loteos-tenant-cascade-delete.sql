-- Permite eliminar tenants con datos de loteos (antes ON DELETE RESTRICT bloqueaba el DELETE)
ALTER TABLE loteos DROP CONSTRAINT IF EXISTS loteos_tenantId_fkey;
ALTER TABLE loteos
  ADD CONSTRAINT loteos_tenantId_fkey
  FOREIGN KEY ("tenantId") REFERENCES tenants("tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE lote_ventas DROP CONSTRAINT IF EXISTS lote_ventas_tenantId_fkey;
ALTER TABLE lote_ventas
  ADD CONSTRAINT lote_ventas_tenantId_fkey
  FOREIGN KEY ("tenantId") REFERENCES tenants("tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;
