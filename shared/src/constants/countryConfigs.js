/**
 * Configuraciones de documentos y validaciones por país (LATAM)
 * Soporta 8 países: Argentina, Brasil, Chile, Colombia, Ecuador, México, Perú, Uruguay
 */

export const COUNTRY_CONFIGS = {
  // ==================== ARGENTINA ====================
  AR: {
    name: 'Argentina',
    flag: '🇦🇷',
    documentTypes: {
      person: {
        primary: {
          type: 'DNI',
          format: /^\d{7,8}$/,
          placeholder: 'XXXXXXXX',
          label: 'DNI',
          helpText: 'Documento Nacional de Identidad (7 u 8 dígitos)',
          maxLength: 8,
        },
        tax: {
          type: 'CUIL',
          format: /^\d{2}-\d{8}-\d$/,
          placeholder: 'XX-XXXXXXXX-X',
          label: 'CUIL',
          helpText: 'Código Único de Identificación Laboral',
          maxLength: 13,
        },
      },
      company: {
        type: 'CUIT',
        format: /^\d{2}-\d{8}-\d$/,
        placeholder: 'XX-XXXXXXXX-X',
        label: 'CUIT',
        helpText: 'Clave Única de Identificación Tributaria',
        maxLength: 13,
      },
      foreigner: {
        type: 'CDI',
        format: /^\d{2}-\d{8}-\d$/,
        placeholder: 'XX-XXXXXXXX-X',
        label: 'CDI',
        helpText: 'Clave de Identificación (Extranjeros)',
        maxLength: 13,
      },
    },
    realEstateLicense: {
      required: true,
      label: 'Matrícula Inmobiliaria',
      format: /^\d+$/,
      placeholder: '12345',
      helpText: 'Número de matrícula otorgado por el Colegio de Corredores Inmobiliarios',
      issuingBody: 'Colegio de Corredores Inmobiliarios Provincial',
    },
    currency: {
      code: 'ARS',
      symbol: '$',
      name: 'Peso Argentino',
    },
    phoneFormat: {
      mobileDigits: 10,
      format: '+54 9 XXX XXX-XXXX',
      regex: /^\d{10}$/,
    },
    addressFormat: {
      format: 'Calle, Número, Piso/Depto, Ciudad, Provincia, CP',
      postalCodeFormat: /^\d{4}$/,
    },
    taxRegime: 'Monotributo / Responsable Inscripto',
  },

  // ==================== BRASIL ====================
  BR: {
    name: 'Brasil',
    flag: '🇧🇷',
    documentTypes: {
      person: {
        primary: {
          type: 'RG',
          format: /^\d{1,2}\.\d{3}\.\d{3}-[0-9X]$/,
          placeholder: 'XX.XXX.XXX-X',
          label: 'RG',
          helpText: 'Registro Geral (Cédula de Identidade)',
          maxLength: 12,
        },
        tax: {
          type: 'CPF',
          format: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
          placeholder: 'XXX.XXX.XXX-XX',
          label: 'CPF',
          helpText: 'Cadastro de Pessoas Físicas',
          maxLength: 14,
        },
      },
      company: {
        type: 'CNPJ',
        format: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
        placeholder: 'XX.XXX.XXX/XXXX-XX',
        label: 'CNPJ',
        helpText: 'Cadastro Nacional da Pessoa Jurídica',
        maxLength: 18,
      },
    },
    realEstateLicense: {
      required: true,
      label: 'CRECI',
      format: /^\d{1,6}-[A-Z]{2}$/,
      placeholder: 'XXXXX-UF',
      helpText: 'Conselho Regional de Corretores de Imóveis',
      issuingBody: 'CRECI Regional',
    },
    currency: {
      code: 'BRL',
      symbol: 'R$',
      name: 'Real Brasileiro',
    },
    phoneFormat: {
      mobileDigits: 11,
      format: '+55 XX XXXXX-XXXX',
      regex: /^\d{11}$/,
    },
    addressFormat: {
      format: 'Rua, Número, Complemento, Bairro, Cidade, Estado, CEP',
      postalCodeFormat: /^\d{5}-\d{3}$/,
    },
  },

  // ==================== CHILE ====================
  CL: {
    name: 'Chile',
    flag: '🇨🇱',
    documentTypes: {
      person: {
        primary: {
          type: 'RUN',
          format: /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/,
          placeholder: 'XX.XXX.XXX-X',
          label: 'RUN',
          helpText: 'Rol Único Nacional',
          maxLength: 12,
        },
        tax: {
          type: 'RUT',
          format: /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/,
          placeholder: 'XX.XXX.XXX-X',
          label: 'RUT',
          helpText: 'Rol Único Tributario (igual al RUN)',
          maxLength: 12,
        },
      },
      company: {
        type: 'RUT',
        format: /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/,
        placeholder: 'XX.XXX.XXX-X',
        label: 'RUT Empresa',
        helpText: 'Rol Único Tributario de la empresa',
        maxLength: 12,
      },
    },
    realEstateLicense: {
      required: false,
      label: 'Registro Corredor',
      helpText: 'No es obligatorio pero se recomienda estar registrado',
    },
    currency: {
      code: 'CLP',
      symbol: '$',
      name: 'Peso Chileno',
    },
    phoneFormat: {
      mobileDigits: 9,
      format: '+56 9 XXXX XXXX',
      regex: /^\d{9}$/,
    },
  },

  // ==================== COLOMBIA ====================
  CO: {
    name: 'Colombia',
    flag: '🇨🇴',
    documentTypes: {
      person: {
        primary: {
          type: 'CC',
          format: /^\d{6,10}$/,
          placeholder: 'XXXXXXXXXX',
          label: 'Cédula de Ciudadanía',
          helpText: 'Documento de identidad (6-10 dígitos)',
          maxLength: 10,
        },
        tax: {
          type: 'NIT',
          format: /^\d{9,10}-\d$/,
          placeholder: 'XXXXXXXXX-X',
          label: 'NIT',
          helpText: 'Número de Identificación Tributaria',
          maxLength: 11,
        },
      },
      company: {
        type: 'NIT',
        format: /^\d{9,10}-\d$/,
        placeholder: 'XXXXXXXXX-X',
        label: 'NIT Empresa',
        helpText: 'Número de Identificación Tributaria',
        maxLength: 11,
      },
    },
    realEstateLicense: {
      required: true,
      label: 'Matrícula Lonja',
      format: /^\d+$/,
      placeholder: 'XXXXX',
      helpText: 'Matrícula otorgada por la Lonja de Propiedad Raíz',
      issuingBody: 'Lonja de Propiedad Raíz',
    },
    currency: {
      code: 'COP',
      symbol: '$',
      name: 'Peso Colombiano',
    },
    phoneFormat: {
      mobileDigits: 10,
      format: '+57 XXX XXX XXXX',
      regex: /^\d{10}$/,
    },
  },

  // ==================== ECUADOR ====================
  EC: {
    name: 'Ecuador',
    flag: '🇪🇨',
    documentTypes: {
      person: {
        primary: {
          type: 'CI',
          format: /^\d{10}$/,
          placeholder: 'XXXXXXXXXX',
          label: 'Cédula de Identidad',
          helpText: 'Documento de identidad (10 dígitos)',
          maxLength: 10,
        },
        tax: {
          type: 'CI',
          format: /^\d{10}$/,
          placeholder: 'XXXXXXXXXX',
          label: 'Cédula (fiscal)',
          helpText: 'Misma cédula se usa para fines tributarios',
          maxLength: 10,
        },
      },
      company: {
        type: 'RUC',
        format: /^\d{13}$/,
        placeholder: 'XXXXXXXXXXXXX',
        label: 'RUC',
        helpText: 'Registro Único de Contribuyentes (13 dígitos)',
        maxLength: 13,
      },
    },
    realEstateLicense: {
      required: false,
      label: 'Registro inmobiliario',
      helpText: 'No es obligatorio tener licencia específica',
    },
    currency: {
      code: 'USD',
      symbol: '$',
      name: 'Dólar Estadounidense',
    },
    phoneFormat: {
      mobileDigits: 10,
      format: '+593 XX XXX XXXX',
      regex: /^\d{10}$/,
    },
  },

  // ==================== MÉXICO ====================
  MX: {
    name: 'México',
    flag: '🇲🇽',
    documentTypes: {
      person: {
        primary: {
          type: 'CURP',
          format: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/,
          placeholder: 'AAAA000000HXXXXXX0',
          label: 'CURP',
          helpText: 'Clave Única de Registro de Población',
          maxLength: 18,
        },
        tax: {
          type: 'RFC',
          format: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
          placeholder: 'AAAA000000XXX',
          label: 'RFC',
          helpText: 'Registro Federal de Contribuyentes',
          maxLength: 13,
        },
      },
      company: {
        type: 'RFC',
        format: /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/,
        placeholder: 'AAA000000XXX',
        label: 'RFC Empresa',
        helpText: 'Registro Federal de Contribuyentes',
        maxLength: 12,
      },
    },
    realEstateLicense: {
      required: false,
      label: 'Cédula Profesional',
      helpText: 'No es obligatorio pero se recomienda',
    },
    currency: {
      code: 'MXN',
      symbol: '$',
      name: 'Peso Mexicano',
    },
    phoneFormat: {
      mobileDigits: 10,
      format: '+52 XXX XXX XXXX',
      regex: /^\d{10}$/,
    },
  },

  // ==================== PERÚ ====================
  PE: {
    name: 'Perú',
    flag: '🇵🇪',
    documentTypes: {
      person: {
        primary: {
          type: 'DNI',
          format: /^\d{8}$/,
          placeholder: 'XXXXXXXX',
          label: 'DNI',
          helpText: 'Documento Nacional de Identidad (8 dígitos)',
          maxLength: 8,
        },
        tax: {
          type: 'RUC',
          format: /^\d{11}$/,
          placeholder: 'XXXXXXXXXXX',
          label: 'RUC',
          helpText: 'Registro Único de Contribuyentes (11 dígitos)',
          maxLength: 11,
        },
      },
      company: {
        type: 'RUC',
        format: /^\d{11}$/,
        placeholder: 'XXXXXXXXXXX',
        label: 'RUC Empresa',
        helpText: 'Registro Único de Contribuyentes',
        maxLength: 11,
      },
    },
    realEstateLicense: {
      required: false,
      label: 'Registro de corredor',
      helpText: 'No es obligatorio tener licencia específica',
    },
    currency: {
      code: 'PEN',
      symbol: 'S/',
      name: 'Sol Peruano',
    },
    phoneFormat: {
      mobileDigits: 9,
      format: '+51 XXX XXX XXX',
      regex: /^\d{9}$/,
    },
  },

  // ==================== URUGUAY ====================
  UY: {
    name: 'Uruguay',
    flag: '🇺🇾',
    documentTypes: {
      person: {
        primary: {
          type: 'CI',
          format: /^\d{1,2}\.\d{3}\.\d{3}-\d$/,
          placeholder: 'X.XXX.XXX-X',
          label: 'Cédula de Identidad',
          helpText: 'Documento de identidad uruguayo',
          maxLength: 12,
        },
        tax: {
          type: 'RUT',
          format: /^\d{12}$/,
          placeholder: 'XXXXXXXXXXXX',
          label: 'RUT',
          helpText: 'Rol Único Tributario (12 dígitos)',
          maxLength: 12,
        },
      },
      company: {
        type: 'RUT',
        format: /^\d{12}$/,
        placeholder: 'XXXXXXXXXXXX',
        label: 'RUT Empresa',
        helpText: 'Rol Único Tributario',
        maxLength: 12,
      },
    },
    realEstateLicense: {
      required: true,
      label: 'Matrícula Inmobiliaria',
      format: /^\d+$/,
      placeholder: 'XXXXX',
      helpText: 'Matrícula otorgada por el Colegio de Corredores Inmobiliarios',
      issuingBody: 'Colegio de Corredores Inmobiliarios del Uruguay',
    },
    currency: {
      code: 'UYU',
      symbol: '$U',
      name: 'Peso Uruguayo',
    },
    phoneFormat: {
      mobileDigits: 9,
      format: '+598 XX XXX XXX',
      regex: /^\d{9}$/,
    },
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Obtener configuración de un país específico
 */
export const getCountryConfig = (countryCode) => {
  return COUNTRY_CONFIGS[countryCode] || null;
};

/**
 * Validar formato de documento según país
 */
export const validateDocument = (value, documentCode, countryCode) => {
  const config = getCountryConfig(countryCode);
  if (!config) return false;

  if (config.documentTypes.person?.primary?.type === documentCode) {
    return config.documentTypes.person.primary.format.test(value);
  }

  if (config.documentTypes.person?.tax?.type === documentCode) {
    return config.documentTypes.person.tax.format.test(value);
  }

  if (config.documentTypes.company?.type === documentCode) {
    return config.documentTypes.company.format.test(value);
  }

  if (config.documentTypes.foreigner?.type === documentCode) {
    return config.documentTypes.foreigner.format.test(value);
  }

  return false;
};

/**
 * Obtener placeholder de un documento según país
 */
export const getDocumentPlaceholder = (documentCode, countryCode) => {
  const config = getCountryConfig(countryCode);
  if (!config) return '';

  if (config.documentTypes.person?.primary?.type === documentCode) {
    return config.documentTypes.person.primary.placeholder;
  }

  if (config.documentTypes.person?.tax?.type === documentCode) {
    return config.documentTypes.person.tax.placeholder;
  }

  if (config.documentTypes.company?.type === documentCode) {
    return config.documentTypes.company.placeholder;
  }

  if (config.documentTypes.foreigner?.type === documentCode) {
    return config.documentTypes.foreigner.placeholder;
  }

  return '';
};

// ==================== AVAILABLE COUNTRIES ====================

export const AVAILABLE_COUNTRIES = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', priority: 1 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', priority: 2 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', priority: 2 },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', priority: 3 },
  { code: 'MX', name: 'México', flag: '🇲🇽', priority: 3 },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', priority: 3 },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', priority: 4 },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', priority: 4 },
];
