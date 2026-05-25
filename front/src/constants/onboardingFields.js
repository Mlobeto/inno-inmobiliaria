/** Campos mínimos para considerar el perfil de la inmobiliaria completo. */
export const REQUIRED_TENANT_FIELDS = [
  'company_name',
  'company_cuit',
  'company_address',
  'company_phone',
  'company_email',
];

export function isTenantProfileComplete(settings = {}) {
  return REQUIRED_TENANT_FIELDS.every(
    (field) => settings[field] && String(settings[field]).trim() !== '',
  );
}
