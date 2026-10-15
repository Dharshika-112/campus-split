import { calculateBalances, generateSettlementPlan } from '../services/financeService.js';

export async function getBalances(req, res, next) {
  try {
    const balances = await calculateBalances(req.params.tripId);
    res.json(balances);
  } catch (err) { next(err); }
}

export async function getSettlementPlan(req, res, next) {
  try {
    const balances = await calculateBalances(req.params.tripId);
    const plan     = generateSettlementPlan(balances);
    res.json({ balances, plan });
  } catch (err) { next(err); }
}
