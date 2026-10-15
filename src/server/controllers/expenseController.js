import * as expenseService from '../services/expenseService.js';
import { validateRequired, validatePositivePaise, validateDate } from '../utils/validation.js';
import { rupeesToPaise } from '../utils/money.js';

function parseAndValidateExpense(body) {
  const { title, description, category, amount, amountPaise, expenseDate, paidByParticipantId, beneficiaryIds } = body;

  const titleCheck = validateRequired(title, 'Title');
  if (!titleCheck.valid) return { error: titleCheck.error };

  const dateCheck = validateDate(expenseDate, 'Expense date');
  if (!dateCheck.valid) return { error: dateCheck.error };

  const payerCheck = validateRequired(paidByParticipantId, 'Payer');
  if (!payerCheck.valid) return { error: payerCheck.error };

  if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
    return { error: 'At least one beneficiary is required' };
  }

  // Accept either pre-converted paise or rupee amount
  let finalPaise;
  if (amountPaise !== undefined) {
    finalPaise = parseInt(amountPaise);
  } else {
    try { finalPaise = rupeesToPaise(amount); } catch {
      return { error: 'Invalid amount' };
    }
  }
  const paiseCheck = validatePositivePaise(finalPaise, 'Amount');
  if (!paiseCheck.valid) return { error: paiseCheck.error };

  return {
    data: {
      title, description, category: category || 'Other',
      amountPaise: finalPaise,
      expenseDate,
      paidByParticipantId: parseInt(paidByParticipantId),
      beneficiaryIds: beneficiaryIds.map(Number),
    }
  };
}

export async function listExpenses(req, res, next) {
  try {
    const expenses = await expenseService.getExpenses(req.params.tripId);
    res.json(expenses);
  } catch (err) { next(err); }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await expenseService.getExpenseById(req.params.expenseId);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
}

export async function createExpense(req, res, next) {
  try {
    const parsed = parseAndValidateExpense(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const expense = await expenseService.createExpense(req.params.tripId, parsed.data);
    res.status(201).json(expense);
  } catch (err) {
    if (err.message.includes('does not belong')) err.status = 400;
    next(err);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const parsed = parseAndValidateExpense(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    // Verify the expense belongs to this trip
    const existing = await expenseService.getExpenseById(req.params.expenseId);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (String(existing.trip_id) !== String(req.params.tripId)) {
      return res.status(403).json({ error: 'Expense does not belong to this trip' });
    }

    const expense = await expenseService.updateExpense(req.params.expenseId, req.params.tripId, parsed.data);
    res.json(expense);
  } catch (err) {
    if (err.message.includes('cannot be modified')) err.status = 403;
    next(err);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const existing = await expenseService.getExpenseById(req.params.expenseId);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    if (String(existing.trip_id) !== String(req.params.tripId)) {
      return res.status(403).json({ error: 'Expense does not belong to this trip' });
    }

    const deleted = await expenseService.deleteExpense(req.params.expenseId, req.params.tripId);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    if (err.message.includes('cannot be deleted')) err.status = 403;
    next(err);
  }
}
