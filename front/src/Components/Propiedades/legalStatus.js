export const LEGAL_STATUS_LABELS = {
  DEED: 'Escritura',
  DEED_IN_PROCESS: 'Escritura en trámite',
  PURCHASE_AGREEMENT: 'Boleto',
  POSSESSION: 'Posesión',
  ASSIGNMENT_OF_RIGHTS: 'Cesión de derechos',
  INHERITANCE_IN_PROCESS: 'Herencia en trámite',
  SUCCESSION: 'Sucesión',
  TRUST: 'Fideicomiso',
  ADVERSE_POSSESSION: 'Usucapión',
  ADVERSE_POSSESSION_IN_PROCESS: 'Prescripción en trámite',
  TITLE_REGULARIZATION: 'Regularización',
  HORIZONTAL_PROPERTY: 'PH',
  CONDOMINIUM: 'Condominio',
  DONATION: 'Donación',
  SUBDIVISION: 'Loteo',
};

export const LEGAL_STATUS_BY_OPERATION_TYPE = {
  sale: [
    'DEED',
    'DEED_IN_PROCESS',
    'PURCHASE_AGREEMENT',
    'POSSESSION',
    'ASSIGNMENT_OF_RIGHTS',
    'INHERITANCE_IN_PROCESS',
    'SUCCESSION',
    'TRUST',
    'ADVERSE_POSSESSION',
    'ADVERSE_POSSESSION_IN_PROCESS',
    'TITLE_REGULARIZATION',
    'HORIZONTAL_PROPERTY',
    'CONDOMINIUM',
    'DONATION',
    'SUBDIVISION',
  ],
  rent: [
    'DEED',
    'DEED_IN_PROCESS',
    'HORIZONTAL_PROPERTY',
    'CONDOMINIUM',
    'TRUST',
    'SUCCESSION',
    'DONATION',
  ],
};

const SAFE_STATUSES = new Set(['DEED', 'HORIZONTAL_PROPERTY', 'CONDOMINIUM', 'DONATION']);
const MEDIUM_STATUSES = new Set([
  'DEED_IN_PROCESS',
  'PURCHASE_AGREEMENT',
  'TRUST',
  'INHERITANCE_IN_PROCESS',
  'SUCCESSION',
  'SUBDIVISION',
]);

export const getLegalStatusOptionsByOperationType = (operationType) => {
  const statuses = LEGAL_STATUS_BY_OPERATION_TYPE[operationType] || [];

  return statuses.map((value) => ({
    value,
    label: LEGAL_STATUS_LABELS[value] || value,
  }));
};

export const isLegalStatusValidForOperationType = (operationType, legalStatus) => {
  if (!operationType || !legalStatus) return false;
  return (LEGAL_STATUS_BY_OPERATION_TYPE[operationType] || []).includes(legalStatus);
};

export const getLegalStatusBadgeConfig = (legalStatus) => {
  if (!legalStatus) return null;

  if (SAFE_STATUSES.has(legalStatus)) {
    return {
      label: 'Safe',
      className: 'bg-green-100 text-green-700',
    };
  }

  if (MEDIUM_STATUSES.has(legalStatus)) {
    return {
      label: 'Medium',
      className: 'bg-yellow-100 text-yellow-700',
    };
  }

  return {
    label: 'Review',
    className: 'bg-red-100 text-red-700',
  };
};
