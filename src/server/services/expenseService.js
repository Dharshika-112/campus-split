import pool from '../db/pool.js';
import { splitEqually } from '../utils/money.js';
import { participantBelongsToTrip } from './participantService.js';
import { tripHasSettlements } from './financeService.js';

export async function getExpenses(tripId) {
  const expRes = await pool.query(
    `SELECT e.*, p.name AS paid_by_name
     FROM expenses e
     JOIN participants p ON p.id = e.paid_by_participant_id
     WHERE e.trip_id = $1
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    [tripId]
  );
  const expenses = expRes.rows;
  if (expenses.length === 0) return [];

  const ids     = expenses.map(e => e.id);
  const shareRes = await pool.query(
    `SELECT es.*, p.name AS participant_name
     FROM expense_shares es
     JOIN participants p ON p.id = es.participant_id
     WHERE es.expense_id = ANY($1)
     ORDER BY es.expense_id, p.name`,
    [ids]
  );

  const sharesById = {};
  for (const s of shareRes.rows) {
    if (!sharesById[s.expense_id]) sharesById[s.expense_id] = [];
    sharesById[s.expense_id].push(s);
  }

  return expenses.map(e => ({ ...e, shares: sharesById[e.id] || [] }));
}

export async function getExpenseById(expenseId) {
  const expRes = await pool.query(
    `SELECT e.*, p.name AS paid_by_name
     FROM expenses e
     JOIN participants p ON p.id = e.paid_by_participant_id
     WHERE e.id = $1`,
    [expenseId]
  );
  if (expRes.rowCount === 0) return null;
  const expense = expRes.rows[0];

  const shareRes = await pool.query(
    `SELECT es.*, p.name AS participant_name
     FROM expense_shares es
     JOIN participants p ON p.id = es.participant_id
     WHERE es.expense_id = $1
     ORDER BY p.name`,
    [expenseId]
  );
  return { ...expense, shares: shareRes.rows };
}

export async function createExpense(tripId, {
  title, description, category, amountPaise,
  expenseDate, paidByParticipantId, beneficiaryIds
}) {
  // Validate payer belongs to trip
  if (!(await participantBelongsToTrip(paidByParticipantId, tripId))) {
    throw new Error('Payer does not belong to this trip');
  }

  // Validate all beneficiaries belong to trip, no duplicates
  const uniqueIds = [...new Set(beneficiaryIds)];
  if (uniqueIds.length !== beneficiaryIds.length) {
    throw new Error('Duplicate beneficiaries are not allowed');
  }
  for (const bid of uniqueIds) {
    if (!(await participantBelongsToTrip(bid, tripId))) {
      throw new Error(`Participant ${bid} does not belong to this trip`);
    }
  }

  const shares = splitEqually(amountPaise, uniqueIds.length);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expRes = await client.query(
      `INSERT INTO expenses (trip_id, paid_by_participant_id, title, description, category, amount_paise, expense_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tripId, paidByParticipantId, title.trim(), description?.trim() || null,
       category || 'Other', amountPaise, expenseDate]
    );
    const expense = expRes.rows[0];

    for (let i = 0; i < uniqueIds.length; i++) {
      await client.query(
        `INSERT INTO expense_shares (expense_id, participant_id, share_paise) VALUES ($1,$2,$3)`,
        [expense.id, uniqueIds[i], shares[i]]
      );
    }

    await client.query('COMMIT');
    return getExpenseById(expense.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateExpense(expenseId, tripId, data) {
  if (await tripHasSettlements(tripId)) {
    throw new Error('Expenses cannot be modified after settlements have been recorded for this trip');
  }

  const { title, description, category, amountPaise, expenseDate, paidByParticipantId, beneficiaryIds } = data;

  if (!(await participantBelongsToTrip(paidByParticipantId, tripId))) {
    throw new Error('Payer does not belong to this trip');
  }
  const uniqueIds = [...new Set(beneficiaryIds)];
  for (const bid of uniqueIds) {
    if (!(await participantBelongsToTrip(bid, tripId))) {
      throw new Error(`Participant ${bid} does not belong to this trip`);
    }
  }

  const shares = splitEqually(amountPaise, uniqueIds.length);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE expenses SET title=$1, description=$2, category=$3, amount_paise=$4,
       expense_date=$5, paid_by_participant_id=$6, updated_at=NOW() WHERE id=$7`,
      [title.trim(), description?.trim() || null, category || 'Other',
       amountPaise, expenseDate, paidByParticipantId, expenseId]
    );
    await client.query('DELETE FROM expense_shares WHERE expense_id=$1', [expenseId]);
    for (let i = 0; i < uniqueIds.length; i++) {
      await client.query(
        `INSERT INTO expense_shares (expense_id, participant_id, share_paise) VALUES ($1,$2,$3)`,
        [expenseId, uniqueIds[i], shares[i]]
      );
    }
    await client.query('COMMIT');
    return getExpenseById(expenseId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteExpense(expenseId, tripId) {
  if (await tripHasSettlements(tripId)) {
    throw new Error('Expenses cannot be deleted after settlements have been recorded for this trip');
  }
  const res = await pool.query(
    'DELETE FROM expenses WHERE id=$1 AND trip_id=$2 RETURNING id',
    [expenseId, tripId]
  );
  return res.rows[0] || null;
}
