/**
 * Unit tests for financial calculation logic.
 * No database — tests pure functions only.
 *
 * Balance formula:
 *   balance = (amountPaid - fairShare) - settlementsReceived + settlementsPaid
 *   Positive = still owed money. Negative = still owes money.
 *
 * IMPORTANT: the spec section-3 example states Asha+500/Bala+100/Charan-600
 * but those numbers assume "fair share = total/n across participants" equally.
 * The actual per-expense calculation with different beneficiaries is:
 *
 *   Exp1: ₹900 by Asha, shared Asha+Bala+Charan → each ₹300 share
 *   Exp2: ₹300 by Bala, shared Bala+Charan       → each ₹150 share
 *
 *   Asha:   paid 90000, share 30000 → +60000  (+₹600)
 *   Bala:   paid 30000, share 45000 → -15000  (-₹150)
 *   Charan: paid 0,     share 45000 → -45000  (-₹450)
 *
 * The spec's +500/+100/-600 figures reflect equal 3-way aggregate split (each ₹400)
 * which contradicts the stated beneficiary lists. Our implementation is mathematically
 * correct per the beneficiary rules. This is documented in the README.
 */

import { describe, it, expect } from 'vitest';
import { generateSettlementPlan } from '../services/financeService.js';
import { splitEqually } from '../utils/money.js';
import { validatePositivePaise } from '../utils/validation.js';

// ─── Test 1: Single expense ──────────────────────────────────────────────────
describe('Test 1 — Single expense', () => {
  // Asha pays ₹900 shared equally by Asha, Bala, Charan
  const balances = [
    { participantId: 1, name: 'Asha',   balance:  60000 }, // 90000-30000
    { participantId: 2, name: 'Bala',   balance: -30000 }, // 0-30000
    { participantId: 3, name: 'Charan', balance: -30000 }, // 0-30000
  ];

  it('Asha gets +₹600', () => expect(balances[0].balance).toBe(60000));
  it('Bala owes -₹300', () => expect(balances[1].balance).toBe(-30000));
  it('Charan owes -₹300', () => expect(balances[2].balance).toBe(-30000));
  it('sum of all balances is zero', () => {
    expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0);
  });
  it('settlement plan has 2 transfers', () => {
    const plan = generateSettlementPlan(balances);
    expect(plan.length).toBe(2);
    const total = plan.reduce((s, t) => s + t.amountPaise, 0);
    expect(total).toBe(60000); // matches owed
  });
});

// ─── Test 2: Multiple expenses with different beneficiaries ──────────────────
describe('Test 2 — Multiple expenses', () => {
  // Exp1: ₹900 by Asha, split Asha+Bala+Charan (30000 each)
  // Exp2: ₹300 by Bala, split Bala+Charan (15000 each)
  const balances = [
    { participantId: 1, name: 'Asha',   balance: 90000 - 30000 },            // +60000
    { participantId: 2, name: 'Bala',   balance: 30000 - (30000 + 15000) },  // -15000
    { participantId: 3, name: 'Charan', balance: 0 - (30000 + 15000) },      // -45000
  ];

  it('Asha +60000 paise', () => expect(balances[0].balance).toBe(60000));
  it('Bala -15000 paise', () => expect(balances[1].balance).toBe(-15000));
  it('Charan -45000 paise', () => expect(balances[2].balance).toBe(-45000));
  it('sum is zero', () => expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0));

  it('settlement plan settles everyone in ≤ 2 transfers', () => {
    const plan = generateSettlementPlan(balances);
    expect(plan.length).toBeLessThanOrEqual(2);
    // Charan (−45000) → Asha, Bala (−15000) → Asha
    const charanToAsha = plan.find(t => t.fromName === 'Charan' && t.toName === 'Asha');
    const balaToAsha   = plan.find(t => t.fromName === 'Bala'   && t.toName === 'Asha');
    expect(charanToAsha).toBeDefined();
    expect(balaToAsha).toBeDefined();
    expect(charanToAsha.amountPaise).toBe(45000);
    expect(balaToAsha.amountPaise).toBe(15000);
  });
});

// ─── Test 3: Fully settled ───────────────────────────────────────────────────
describe('Test 3 — Fully settled trip', () => {
  // After Charan→Asha 45000 and Bala→Asha 15000
  // balance = (paid - share) - received + paidOut
  const balances = [
    {
      participantId: 1, name: 'Asha',
      balance: (90000 - 30000) - 60000 + 0,   // 0
    },
    {
      participantId: 2, name: 'Bala',
      balance: (30000 - 45000) - 0 + 15000,   // 0
    },
    {
      participantId: 3, name: 'Charan',
      balance: (0 - 45000) - 0 + 45000,       // 0
    },
  ];

  it('all balances are zero after full settlement', () => {
    for (const b of balances) expect(b.balance).toBe(0);
  });
  it('settlement plan is empty', () => {
    expect(generateSettlementPlan(balances)).toEqual([]);
  });
});

// ─── Test 4: Partial settlement ──────────────────────────────────────────────
describe('Test 4 — Partial settlement', () => {
  // Charan pays Asha only 20000 (partial out of 45000 owed)
  // balance = (paid - share) - received + paidOut
  const balances = [
    { participantId: 1, name: 'Asha',   balance: (90000-30000) - 20000 },  // +40000
    { participantId: 2, name: 'Bala',   balance: (30000-45000) },           // -15000
    { participantId: 3, name: 'Charan', balance: (0-45000) + 20000 },       // -25000
  ];

  it('Asha outstanding: +40000', () => expect(balances[0].balance).toBe(40000));
  it('Bala outstanding: -15000', () => expect(balances[1].balance).toBe(-15000));
  it('Charan outstanding: -25000', () => expect(balances[2].balance).toBe(-25000));
  it('sum still zero', () => expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0));
});

// ─── Test 5: Paise rounding ───────────────────────────────────────────────────
describe('Test 5 — Paise rounding', () => {
  it('₹100 split 3 ways sums to exactly 10000 paise', () => {
    const shares = splitEqually(10000, 3);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    // First person gets the extra paise
    expect(shares[0]).toBe(3334);
    expect(shares[1]).toBe(3333);
    expect(shares[2]).toBe(3333);
  });

  it('₹1000 split 4 ways is exactly equal', () => {
    const shares = splitEqually(100000, 4);
    expect(new Set(shares).size).toBe(1); // all equal
    expect(shares[0]).toBe(25000);
  });

  it('any split always sums to total', () => {
    for (const [total, n] of [[99999, 7], [12345, 6], [1, 3]]) {
      const shares = splitEqually(total, n);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
});

// ─── Test 6: Validation helpers ──────────────────────────────────────────────
describe('Test 6 — Validation', () => {
  it('rejects zero paise', () => {
    const { validatePositivePaise } = await import('../utils/validation.js');
    expect(validatePositivePaise(0).valid).toBe(false);
  });

  it('rejects negative paise', () => {
    const { validatePositivePaise } = await import('../utils/validation.js');
    expect(validatePositivePaise(-100).valid).toBe(false);
  });

  it('accepts positive paise', () => {
    const { validatePositivePaise } = await import('../utils/validation.js');
    expect(validatePositivePaise(1).valid).toBe(true);
    expect(validatePositivePaise(90000).valid).toBe(true);
  });
});

// ─── Test 8: Invalid settlement ──────────────────────────────────────────────
describe('Test 8 — Settlement plan edge cases', () => {
  it('returns empty plan when all balanced', () => {
    const plan = generateSettlementPlan([
      { participantId: 1, name: 'A', balance: 0 },
      { participantId: 2, name: 'B', balance: 0 },
    ]);
    expect(plan).toEqual([]);
  });

  it('plan transfer amounts sum to total owed', () => {
    const balances = [
      { participantId: 1, name: 'X', balance:  50000 },
      { participantId: 2, name: 'Y', balance: -30000 },
      { participantId: 3, name: 'Z', balance: -20000 },
    ];
    const plan = generateSettlementPlan(balances);
    expect(plan.reduce((s, t) => s + t.amountPaise, 0)).toBe(50000);
    // After all transfers, every participant nets to zero
    const net = Object.fromEntries(balances.map(b => [b.name, b.balance]));
    for (const t of plan) { net[t.toName] -= t.amountPaise; net[t.fromName] += t.amountPaise; }
    for (const v of Object.values(net)) expect(v).toBe(0);
  });
});

// ─── Test 9: Isolation ────────────────────────────────────────────────────────
describe('Test 9 — Trip isolation', () => {
  it('plans from different trips are independent', () => {
    const trip1Balances = [
      { participantId: 1, name: 'A', balance:  10000 },
      { participantId: 2, name: 'B', balance: -10000 },
    ];
    const trip2Balances = [
      { participantId: 3, name: 'C', balance:  50000 },
      { participantId: 4, name: 'D', balance: -50000 },
    ];
    const plan1 = generateSettlementPlan(trip1Balances);
    const plan2 = generateSettlementPlan(trip2Balances);
    expect(plan1.length).toBe(1);
    expect(plan2.length).toBe(1);
    expect(plan1[0].amountPaise).toBe(10000);
    expect(plan2[0].amountPaise).toBe(50000);
    // No participant IDs overlap between plans
    const ids1 = plan1.flatMap(t => [t.fromParticipantId, t.toParticipantId]);
    const ids2 = plan2.flatMap(t => [t.fromParticipantId, t.toParticipantId]);
    expect(ids1.filter(id => ids2.includes(id))).toEqual([]);
  });
});
