-- Migración: reemplazar enum legacy de escritura por legal status en inglés.
-- IMPORTANTE: respaldar antes de ejecutar en producción.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'enum_Property_legalStatus'
  ) THEN
    CREATE TYPE "enum_Property_legalStatus" AS ENUM (
      'DEED',
      'PURCHASE_AGREEMENT',
      'POSSESSION',
      'ASSIGNMENT_OF_RIGHTS',
      'INHERITANCE_IN_PROCESS',
      'TRUST',
      'ADVERSE_POSSESSION',
      'TITLE_REGULARIZATION',
      'HORIZONTAL_PROPERTY',
      'SUBDIVISION'
    );
  END IF;
END $$;

ALTER TABLE "Property"
  ALTER COLUMN "escritura" TYPE "enum_Property_legalStatus"
  USING (
    CASE "escritura"::text
      WHEN 'escritura' THEN 'DEED'::"enum_Property_legalStatus"
      WHEN 'posesion' THEN 'POSSESSION'::"enum_Property_legalStatus"
      WHEN 'sesión de derechos posesorios' THEN 'ASSIGNMENT_OF_RIGHTS'::"enum_Property_legalStatus"
      WHEN 'prescripcion en tramite' THEN 'ADVERSE_POSSESSION'::"enum_Property_legalStatus"
      WHEN 'prescripcion adjudicada' THEN 'TITLE_REGULARIZATION'::"enum_Property_legalStatus"
      ELSE 'DEED'::"enum_Property_legalStatus"
    END
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'enum_Property_escritura'
  ) THEN
    DROP TYPE "enum_Property_escritura";
  END IF;
END $$;

COMMIT;
