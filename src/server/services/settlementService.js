import pool from '../db/pool.js';
import { calculateBalances } from './financeService.js';
import { participantBelongsToTrip } from './participantService.js';

export async function getSettlements(tripId) {
  const res = await pool.query(
    `SELECT s.*,
            fp.name AS from_name,
            tp.name AS to_name
     FROM settlements s
     JOIN participants fp ON fp.id = s.from_participant_id
     JOIN participants tp ON tp.id = s.to_participant_id
     WHERE s.trip_id = $1
     ORDER BY s.settled_at DESC, s.created_at DESC`,
    [tripId]
  );
  return res.rows;
}

export async function recordSettlement(tripId, { fromParticipantId, toParticipantId, amountPaise, settledAt }) {
  // Self-payment check
  if (fromParticipantId === toParticipantId) {
    throw new Error('A participant cannot settle with themselves');
  }

  // Both must belong to this trip
  if (!(await participantBelongsToTrip(fromParticipantId, tripId))) {
    throw new Error('From-participant does not belong to this trip');
  }
  if (!(await participantBelongsToTrip(toParticipantId, tripId))) {
    throw new Error('To-participant does not belong to this trip');
  }

  // Validate against current balances (prevent overpayment)
  const balances = await calculateBalances(tripId);
  const payerBalance    = balances.find(b => b.participantId === fromParticipantId);
  const receiverBalance = balances.find(b => b.participantId === toParticipantId);

  if (!payerBalance || payerBalance.balance >= 0) {
    throw new Error('This participant does not currently owe money');
  }
  if (!receiverBalance || receiverBalance.balance <= 0) {
    throw new Error('The recipient is not currently owed money');
  }

  const maxPayable    = -payerBalance.balance;      // how much payer owes
  const maxReceivable = receiverBalance.balance;    // how much receiver is owed

  if (amountPaise > maxPayable) {
    throw new Error(
      `Settlement amount exceeds what the payer owes (max ${maxPayable} paise)`
    );
  }
  if (amountPaise > maxReceivable) {
    throw new Error(
      `Settlement amount exceeds what the receiver is owed (max ${maxReceivable} paise)`
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO settlements (trip_id, from_participant_id, to_participant_id, amount_paise, settled_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tripId, fromParticipantId, toParticipantId, amountPaise, settledAt || new Date().toISOString().split('T')[0]]
    );
    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
