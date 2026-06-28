-- Módulo add-on: Facturación Electrónica ARCA ($7.000/mes)
INSERT INTO modules (
  "moduleId",
  "name",
  "description",
  "price",
  "currency",
  "featureKeys",
  "question",
  "icon",
  "sortOrder",
  "isActive"
)
VALUES (
  'electronic_invoicing',
  'Facturación Electrónica ARCA',
  'Emití facturas electrónicas con AFIP/ARCA desde el sistema: comprobantes A, B, C y notas de crédito.',
  7000.00,
  'ARS',
  '["electronic_invoicing", "electronicInvoicing"]'::jsonb,
  '¿Necesitás emitir facturas electrónicas con AFIP/ARCA?',
  'receipt',
  7,
  TRUE
)
ON CONFLICT ("moduleId") DO UPDATE SET
  "name"        = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price"       = EXCLUDED."price",
  "featureKeys" = EXCLUDED."featureKeys",
  "question"    = EXCLUDED."question",
  "icon"        = EXCLUDED."icon",
  "sortOrder"   = EXCLUDED."sortOrder",
  "isActive"    = EXCLUDED."isActive",
  "updatedAt"   = NOW();
