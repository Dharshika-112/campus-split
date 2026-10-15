/**
 * Validation helpers — return { valid: bool, error: string }
 */

export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validatePositivePaise(paise, fieldName = 'Amount') {
  if (!Number.isInteger(paise) || paise <= 0) {
    return { valid: false, error: `${fieldName} must be a positive integer (paise)` };
  }
  return { valid: true };
}

export function validateDate(dateStr, fieldName = 'Date') {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { valid: false, error: `${fieldName} is not a valid date` };
  }
  return { valid: true };
}

export function validateDateRange(start, end) {
  if (!end) return { valid: true };
  if (new Date(end) < new Date(start)) {
    return { valid: false, error: 'End date must be on or after start date' };
  }
  return { valid: true };
}
