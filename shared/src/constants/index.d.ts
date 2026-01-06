/**
 * Type definitions for constants module
 */

// Argentina Locations
export interface Provincia {
  id: string;
  name: string;
}

export const PROVINCIAS_ARGENTINA: Provincia[];
export const CIUDADES_POR_PROVINCIA: { [key: string]: string[] };
export function getCiudadesByProvincia(provinciaId: string): string[];

// Country Configurations
export interface DocumentTypeConfig {
  type: string;
  format: RegExp;
  placeholder: string;
  label: string;
  helpText: string;
  maxLength?: number;
}

export interface RealEstateLicenseConfig {
  required: boolean;
  label: string;
  format?: RegExp;
  placeholder?: string;
  helpText?: string;
  issuingBody?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface PhoneFormatConfig {
  mobileDigits: number;
  format: string;
  regex: RegExp;
}

export interface AddressFormatConfig {
  format: string;
  postalCodeFormat: RegExp;
}

export interface CountryConfig {
  name: string;
  flag: string;
  documentTypes: {
    person: {
      primary: DocumentTypeConfig;
      tax: DocumentTypeConfig;
    };
    company: DocumentTypeConfig;
    foreigner?: DocumentTypeConfig;
  };
  realEstateLicense: RealEstateLicenseConfig;
  currency: CurrencyConfig;
  phoneFormat: PhoneFormatConfig;
  addressFormat?: AddressFormatConfig;
  taxRegime?: string;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  priority: number;
}

export const COUNTRY_CONFIGS: {
  AR: CountryConfig;
  BR: CountryConfig;
  CL: CountryConfig;
  CO: CountryConfig;
  EC: CountryConfig;
  MX: CountryConfig;
  PE: CountryConfig;
  UY: CountryConfig;
  [key: string]: CountryConfig;
};

export function getCountryConfig(countryCode: string): CountryConfig | null;
export function validateDocument(value: string, documentCode: string, countryCode: string): boolean;
export function getDocumentPlaceholder(documentCode: string, countryCode: string): string;

export const AVAILABLE_COUNTRIES: CountryOption[];
