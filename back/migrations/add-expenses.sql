-- Tabla de gastos operativos de la inmobiliaria
CREATE TABLE IF NOT EXISTS "Expenses" (
  "id"          SERIAL PRIMARY KEY,
  "tenantId"    INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  "date"        DATE NOT NULL,
  "amount"      DECIMAL NOT NULL,
  "category"    VARCHAR(100) NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_expenses_tenant"   ON "Expenses"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_expenses_date"     ON "Expenses"("date");
CREATE INDEX IF NOT EXISTS "idx_expenses_category" ON "Expenses"("category");
