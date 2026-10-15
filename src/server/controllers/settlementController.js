import * as settlementService from '../services/settlementService.js';
import { validatePositivePaise } from '../utils/validation.js';
import { rupeesToPaise } from '../utils/money.js';

export async function listSettlements(req, res, next) {
  try {
    const settlements = await settlementService.getSettlements(req.params.tripId);
    res.json(settlements);
  } catch (err) { next(err); }
}

export async function createSettlement(req, res, next) {
  try {
    const { fromParticipantId, toParticipantId, amount, amountPaise, settledAt } = req.body;

    if (!fromParticipantId || !toParticipantId) {
      return res.status(400).json({ error: 'fromParticipantId and toParticipantId are required' });
    }

    let finalPaise;
    if (amountPaise !== undefined) {
      finalPaise = parseInt(amountPaise);
    } else {
      try { finalPaise = rupeesToPaise(amount); } catch {
        return res.status(400).json({ error: 'Invalid amount' });
      }
    }

    const paiseCheck = validatePositivePaise(finalPaise, 'Settlement amount');
    if (!paiseCheck.valid) return res.status(400).json({ error: paiseCheck.error });

    const settlement = await settlementService.recordSettlement(req.params.tripId, {
      fromParticipantId: parseInt(fromParticipantId),
      toParticipantId:   parseInt(toParticipantId),
      amountPaise:       finalPaise,
      settledAt,
    });
    res.status(201).json(settlement);
  } catch (err) {
    if (
      err.message.includes('cannot settle with themselves') ||
      err.message.includes('does not belong') ||
      err.message.includes('does not currently owe') ||
      err.message.includes('not currently owed') ||
      err.message.includes('exceeds')
    ) {
      err.status = 400;
    }
    next(err);
  }
}
