import { parsePhoneNumberFromString } from 'libphonenumber-js';

export interface ValidationResult {
  isValid: boolean;
  normalized?: string;
}

export function validateAndNormalizeEmail(email: string): ValidationResult {
  if (typeof email !== 'string') return { isValid: false };
  const trimmed = email.trim();
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false };
  }

  if (trimmed.split('@').length !== 2) {
    return { isValid: false };
  }

  const normalized = trimmed.toLowerCase();
  return {
    isValid: true,
    normalized
  };
}

export function validateAndNormalizePhone(phoneNumber: string): ValidationResult {
  if (typeof phoneNumber !== 'string') return { isValid: false };
  const trimmed = phoneNumber.trim();

  if (/[a-zA-Z]/.test(trimmed)) return { isValid: false };

  const parsed = parsePhoneNumberFromString(trimmed, 'IN');
  if (!parsed || !parsed.isValid()) {
    return { isValid: false };
  }

  if (parsed.country === 'IN') {
    const nationalNumber = parsed.nationalNumber;
    if (nationalNumber.length !== 10) return { isValid: false };
    const firstDigit = nationalNumber[0];
    if (!['6', '7', '8', '9'].includes(firstDigit)) return { isValid: false };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (/^0+$/.test(digitsOnly)) return { isValid: false };

  return {
    isValid: true,
    normalized: parsed.number // E.164 format
  };
}
