import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function validateAndNormalizeEmail(email) {
  if (typeof email !== 'string') return { isValid: false };
  const trimmed = email.trim();
  
  // RFC 5322 compliant regex requiring domain parts with a dot
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

export function validateAndNormalizePhone(phoneNumber) {
  if (typeof phoneNumber !== 'string') return { isValid: false };
  const trimmed = phoneNumber.trim();

  // Basic check for letters/invalid characters
  if (/[a-zA-Z]/.test(trimmed)) return { isValid: false };

  // Parse with default region India (IN)
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

  // Reject all zeros
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (/^0+$/.test(digitsOnly)) return { isValid: false };

  return {
    isValid: true,
    normalized: parsed.number // E.164 format (e.g., +919876543210)
  };
}
