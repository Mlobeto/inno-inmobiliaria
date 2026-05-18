-- AlterTable: campos para idempotencia CRM <- preguntas Mercado Libre
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "mercadolibreQuestionId" VARCHAR(64);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "propertyId" INTEGER;

-- Unique (tenantId + id pregunta ML); filas manuales tienen mercadolibreQuestionId NULL
CREATE UNIQUE INDEX IF NOT EXISTS "uq_leads_tenant_ml_question" ON "leads"("tenantId", "mercadolibreQuestionId");

CREATE INDEX IF NOT EXISTS "idx_leads_property" ON "leads"("propertyId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_propertyId_fkey'
  ) THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_propertyId_fkey"
      FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
