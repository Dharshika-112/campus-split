import { describe, it, expect } from 'vitest';
import { splitEqually, rupeesToPaise, paiseToRupees } from '../utils/money.js';

describe('splitEqually', () => {
  it('splits evenly when divisible', () => {
    const shares = splitEqually(90000, 3); // ₹900 / 3
    expect(shares).toEqual([30000, 30000, 30000]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(90000);
  });

  it('distributes remainder deterministically (Test 5)', () => {
    // ₹100 (10000 paise) / 3
    const shares = splitEqually(10000, 3);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    // First person gets 3334, next two get 3333
    expect(shares[0]).toBe(3334);
    expect(shares[1]).toBe(3333);
    expect(shares[2]).toBe(3333);
  });

  it('handles single beneficiary', () => {
    expect(splitEqually(50000, 1)).toEqual([50000]);
  });

  it('throws on zero count', () => {
    expect(() => splitEqually(10000, 0)).toThrow();
  });
});

describe('rupeesToPaise', () => {
  it('converts whole rupees', () => {
    expect(rupeesToPaise(900)).toBe(90000);
    expect(rupeesToPaise('300')).toBe(30000);
  });

  it('converts decimal rupees', () => {
    expect(rupeesToPaise(900.50)).toBe(90050);
    expect(rupeesToPaise('1.99')).toBe(199);
  });
});
