-- Agrega nuevo estado legal para casos provinciales de alquiler.
-- Seguro para ejecutar en entornos donde el enum ya existe.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'enum_Property_legalStatus'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_Property_legalStatus'
        AND e.enumlabel = 'DEED_IN_PROCESS'
    ) THEN
      ALTER TYPE "enum_Property_legalStatus" ADD VALUE 'DEED_IN_PROCESS';
    END IF;
  END IF;
END $$;
