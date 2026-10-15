/**
 * Financial calculation service.
 * All amounts in integer paise. No floating-point arithmetic.
 *
 * Balance formula per participant:
 *   balance = (amount_paid - fair_share) - settlements_received + settlements_paid
 *
 * Interpretation:
 *   (amount_paid - fair_share) = raw entitlement from expenses alone
 *   settlements_received reduces outstanding receivable (you've been paid back)
 *   settlements_paid reduces outstanding payable (you've paid someone)
 *
 * Positive balance → participant is still owed money.
 * Negative balance → participant still owes money.
 * Zero → fully settled.
 * The sum of all balances in a trip is always zero.
 */

import pool from '../db/pool.js';

/**
 * Calculate balances for every participant in a trip.
 * Returns array of:
 *   { participantId, name, amountPaid, fairShare, settlementsReceived, settlementsPaid, balance }
 */
export async function calculateBalances(tripId) {
  // 1. Sum of expense_shares per participant (fair share)
  const shareRes = await pool.query(
    `SELECT p.id AS participant_id, p.name,
            COALESCE(SUM(es.share_paise), 0)::BIGINT AS fair_share
     FROM participants p
     LEFT JOIN expense_shares es ON es.participant_id = p.id
     LEFT JOIN expenses e ON e.id = es.expense_id AND e.trip_id = $1
     WHERE p.trip_id = $1
     GROUP BY p.id, p.name
     ORDER BY p.id`,
    [tripId]
  );

  // 2. Sum of expenses paid per participant
  const paidRes = await pool.query(
    `SELECT p.id AS participant_id,
            COALESCE(SUM(e.amount_paise), 0)::BIGINT AS amount_paid
     FROM participants p
     LEFT JOIN expenses e ON e.paid_by_participant_id = p.id AND e.trip_id = $1
     WHERE p.trip_id = $1
     GROUP BY p.id
     ORDER BY p.id`,
    [tripId]
  );

  // 3. Settlements
  const settleRes = await pool.query(
    `SELECT p.id AS participant_id,
            COALESCE(SUM(CASE WHEN s.to_participant_id   = p.id THEN s.amount_paise ELSE 0 END), 0)::BIGINT AS received,
            COALESCE(SUM(CASE WHEN s.from_participant_id = p.id THEN s.amount_paise ELSE 0 END), 0)::BIGINT AS paid_out
     FROM participants p
     LEFT JOIN settlements s ON s.trip_id = $1
       AND (s.from_participant_id = p.id OR s.to_participant_id = p.id)
     WHERE p.trip_id = $1
     GROUP BY p.id
     ORDER BY p.id`,
    [tripId]
  );

  // Index lookup maps
  const paidMap   = Object.fromEntries(paidRes.rows.map(r => [r.participant_id, parseInt(r.amount_paid)]));
  const settleMap = Object.fromEntries(settleRes.rows.map(r => [
    r.participant_id,
    { received: parseInt(r.received), paidOut: parseInt(r.paid_out) }
  ]));

  return shareRes.rows.map(r => {
    const id         = r.participant_id;
    const fairShare  = parseInt(r.fair_share);
    const amountPaid = paidMap[id] ?? 0;
    const { received = 0, paidOut = 0 } = settleMap[id] ?? {};
    // balance = (paid - share) - settlements_received + settlements_paid
    // Positive: still owed. Negative: still owes.
    const balance    = (amountPaid - fairShare) - received + paidOut;

    return {
      participantId:       id,
      name:                r.name,
      amountPaid,
      fairShare,
      settlementsReceived: received,
      settlementsPaid:     paidOut,
      balance,
    };
  });
}

/**
 * Generate a minimum-transfer settlement plan from current balances.
 *
 * Algorithm:
 *   1. Split into debtors (balance < 0) and creditors (balance > 0).
 *   2. Sort both descending by absolute value.
 *   3. Match largest debtor with largest creditor.
 *   4. Transfer min(|debtor|, creditor) and update both.
 *   5. Repeat until empty.
 *
 * Returns array of { fromParticipantId, fromName, toParticipantId, toName, amountPaise }
 */
export function generateSettlementPlan(balances) {
  // Work with copies so we don't mutate the input
  const debtors   = balances
    .filter(b => b.balance < 0)
    .map(b => ({ id: b.participantId, name: b.name, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter(b => b.balance > 0)
    .map(b => ({ id: b.participantId, name: b.name, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor   = debtors[di];
    const creditor = creditors[ci];
    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0) {
      transfers.push({
        fromParticipantId: debtor.id,
        fromName:          debtor.name,
        toParticipantId:   creditor.id,
        toName:            creditor.name,
        amountPaise:       transfer,
      });
    }

    debtor.amount   -= transfer;
    creditor.amount -= transfer;

    if (debtor.amount   === 0) di++;
    if (creditor.amount === 0) ci++;
  }

  return transfers;
}

/**
 * Check whether a trip has any settlement records.
 * Used to enforce the financial lock rule.
 */
export async function tripHasSettlements(tripId) {
  const res = await pool.query(
    'SELECT 1 FROM settlements WHERE trip_id = $1 LIMIT 1',
    [tripId]
  );
  return res.rowCount > 0;
}
