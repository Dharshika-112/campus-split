import { Router } from 'express';
import * as tripCtrl from '../controllers/tripController.js';
import * as participantCtrl from '../controllers/participantController.js';
import * as expenseCtrl from '../controllers/expenseController.js';
import * as balanceCtrl from '../controllers/balanceController.js';
import * as settlementCtrl from '../controllers/settlementController.js';

const router = Router();

router.get   ('/',           tripCtrl.listTrips);
router.post  ('/',           tripCtrl.createTrip);
router.get   ('/:tripId',    tripCtrl.getTrip);
router.patch ('/:tripId',    tripCtrl.updateTrip);
router.delete('/:tripId',    tripCtrl.deleteTrip);

// Participants nested under trip
router.get   ('/:tripId/participants',  participantCtrl.listParticipants);
router.post  ('/:tripId/participants',  participantCtrl.addParticipant);

// Expenses nested under trip
router.get   ('/:tripId/expenses',              expenseCtrl.listExpenses);
router.post  ('/:tripId/expenses',              expenseCtrl.createExpense);
router.get   ('/:tripId/expenses/:expenseId',   expenseCtrl.getExpense);
router.patch ('/:tripId/expenses/:expenseId',   expenseCtrl.updateExpense);
router.delete('/:tripId/expenses/:expenseId',   expenseCtrl.deleteExpense);

// Balances and settlement plan
router.get('/:tripId/balances',         balanceCtrl.getBalances);
router.get('/:tripId/settlement-plan',  balanceCtrl.getSettlementPlan);

// Settlements
router.get ('/:tripId/settlements',  settlementCtrl.listSettlements);
router.post('/:tripId/settlements',  settlementCtrl.createSettlement);

export default router;
