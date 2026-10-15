/**
 * Money utilities — all amounts in integer paise.
 * 1 INR = 100 paise. Never use floating-point for financial arithmetic.
 */

/**
 * Convert rupee float/string input to integer paise.
 * Accepts "900", "900.50", 900, 900.5
 */
export function rupeesToPaise(rupees) {
  const n = Math.round(parseFloat(rupees) * 100);
  if (!Number.isFinite(n)) throw new Error(`Invalid rupee value: ${rupees}`);
  return n;
}

export function paiseToRupees(paise) {
  return paise / 100;
}

/**
 * Format paise as a readable INR string e.g. ₹1,200.00
 */
export function formatPaise(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

/**
 * Distribute totalPaise equally among n beneficiaries.
 * Any remainder paise goes to the first (remainder) beneficiaries — deterministic.
 * Returns array of integer paise values that sum exactly to totalPaise.
 */
export function splitEqually(totalPaise, count) {
  if (count <= 0) throw new Error('Must have at least one beneficiary');
  const base      = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}
