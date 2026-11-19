/**
 * International Phone and Country Constants & Utilities
 * Supports ITU E.164 dial codes, country flags, regex patterns, and placeholder formatting.
 */

export interface CountryPhoneConfig {
  code: string;        // ISO 2-letter country code (IN, DE, US, etc.)
  name: string;        // Country display name
  dialCode: string;    // International calling prefix (e.g. +91, +49)
  flag: string;        // Unicode emoji flag
  placeholder: string; // National number placeholder (e.g. 98765 43210)
  minDigits: number;   // Minimum expected national significant digits (excluding country code)
  maxDigits: number;   // Maximum expected national significant digits
}

export const COUNTRY_PHONE_CONFIGS: CountryPhoneConfig[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', placeholder: '98765 43210', minDigits: 10, maxDigits: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', placeholder: '176 12345678', minDigits: 9, maxDigits: 12 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', placeholder: '7911 123456', minDigits: 10, maxDigits: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', placeholder: '(555) 000-0000', minDigits: 10, maxDigits: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', placeholder: '(555) 000-0000', minDigits: 10, maxDigits: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', placeholder: '85 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78', minDigits: 9, maxDigits: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789', minDigits: 9, maxDigits: 11 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', placeholder: '78 123 45 67', minDigits: 9, maxDigits: 9 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', placeholder: '664 1234567', minDigits: 10, maxDigits: 13 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', placeholder: '512 345 678', minDigits: 9, maxDigits: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678', minDigits: 9, maxDigits: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', placeholder: '50 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', placeholder: '3312 3456', minDigits: 8, maxDigits: 8 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', placeholder: '5123 4567', minDigits: 8, maxDigits: 8 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', placeholder: '8123 4567', minDigits: 8, maxDigits: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', placeholder: '12 345 6789', minDigits: 9, maxDigits: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567', minDigits: 8, maxDigits: 10 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', placeholder: '71 234 5678', minDigits: 9, maxDigits: 9 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', placeholder: '9841 234567', minDigits: 10, maxDigits: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', placeholder: '1712 345678', minDigits: 10, maxDigits: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', placeholder: '300 1234567', minDigits: 10, maxDigits: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', placeholder: '71 123 4567', minDigits: 9, maxDigits: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567', minDigits: 10, maxDigits: 10 }
];

export const DEFAULT_COUNTRY_CODE = 'IN';

/**
 * Find country configuration by ISO code (case-insensitive) or by country Name
 */
export function getCountryConfig(codeOrName: string): CountryPhoneConfig {
  const query = (codeOrName || '').trim().toLowerCase();
  if (!query) return COUNTRY_PHONE_CONFIGS[0];

  const foundByCode = COUNTRY_PHONE_CONFIGS.find(c => c.code.toLowerCase() === query);
  if (foundByCode) return foundByCode;

  const foundByName = COUNTRY_PHONE_CONFIGS.find(c => c.name.toLowerCase() === query);
  if (foundByName) return foundByName;

  return COUNTRY_PHONE_CONFIGS[0]; // defaults to India (+91)
}

/**
 * Split an existing phone string into country config and national number
 * Handles numbers with or without leading '+' (e.g. "+49 176 12345678", "+919876543210", "9876543210")
 */
export function parsePhoneParts(phoneStr: string, fallbackCountryCode = 'IN'): { country: CountryPhoneConfig; nationalNumber: string } {
  const raw = (phoneStr || '').trim();
  if (!raw) {
    return { country: getCountryConfig(fallbackCountryCode), nationalNumber: '' };
  }

  // If string starts with '+', sort country dial codes longest first (+971, +880 before +1, +44)
  if (raw.startsWith('+')) {
    const sortedConfigs = [...COUNTRY_PHONE_CONFIGS].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const conf of sortedConfigs) {
      if (raw.startsWith(conf.dialCode)) {
        const rest = raw.substring(conf.dialCode.length).trim();
        return { country: conf, nationalNumber: rest };
      }
    }
  }

  // Otherwise treat entire raw as national number with fallback country
  return { country: getCountryConfig(fallbackCountryCode), nationalNumber: raw };
}

/**
 * Combine dial code and national number into standard E.164 format (+91 9876543210)
 */
export function formatFullPhoneNumber(dialCode: string, nationalNumber: string): string {
  const cleanDigits = (nationalNumber || '').replace(/[^0-9]/g, '');
  if (!cleanDigits) return '';
  return `${dialCode.trim()} ${cleanDigits}`;
}

/**
 * Strict international validation for phone numbers
 */
export function validateInternationalPhone(
  nationalNumber: string,
  country: CountryPhoneConfig,
  required = true,
  fieldName = 'Phone number'
): string | undefined {
  const trimmed = (nationalNumber || '').trim();

  if (!trimmed) {
    if (required) return `${fieldName} is required.`;
    return undefined;
  }

  const digitsOnly = trimmed.replace(/[^0-9]/g, '');

  if (digitsOnly.length === 0) {
    return `Please enter valid digits for ${fieldName.toLowerCase()}.`;
  }

  if (digitsOnly.length < country.minDigits) {
    return `${country.name} numbers require at least ${country.minDigits} digits (${digitsOnly.length} entered).`;
  }

  if (digitsOnly.length > country.maxDigits) {
    return `${country.name} numbers cannot exceed ${country.maxDigits} digits (${digitsOnly.length} entered).`;
  }

  return undefined;
}
