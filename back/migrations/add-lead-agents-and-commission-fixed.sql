-- ============================================================
-- Tabla de asignación de agentes a leads (relación M:N)
-- Un lead puede tener varios agentes asignados.
-- Un agente puede tener varios leads asignados.
-- ============================================================
CREATE TABLE IF NOT EXISTS "lead_agents" (
  "leadId"     INTEGER NOT NULL REFERENCES "leads"("id")   ON DELETE CASCADE,
  "agentId"    INTEGER NOT NULL REFERENCES "admins"("adminId") ON DELETE CASCADE,
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("leadId", "agentId")
);

CREATE INDEX IF NOT EXISTS "idx_lead_agents_lead"  ON "lead_agents"("leadId");
CREATE INDEX IF NOT EXISTS "idx_lead_agents_agent" ON "lead_agents"("agentId");

-- ============================================================
-- Soporte de monto fijo en comisiones de agentes
-- Coexiste con el porcentaje: se usa uno u otro según el caso.
-- ============================================================
ALTER TABLE "commissions"
  ADD COLUMN IF NOT EXISTS "agentCommissionFixedAmount" DECIMAL(12,2);
