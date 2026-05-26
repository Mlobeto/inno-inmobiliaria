-- Plano interactivo: imagen del loteo + posición de cada lote (0–1)
ALTER TABLE loteos ADD COLUMN IF NOT EXISTS "planImageUrl" VARCHAR(500);

ALTER TABLE lotes ADD COLUMN IF NOT EXISTS "planX" DOUBLE PRECISION;
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS "planY" DOUBLE PRECISION;

COMMENT ON COLUMN loteos."planImageUrl" IS 'URL de la imagen usada como plano interactivo';
COMMENT ON COLUMN lotes."planX" IS 'Posición horizontal en el plano (0–1)';
COMMENT ON COLUMN lotes."planY" IS 'Posición vertical en el plano (0–1)';
