import * as tripService from '../services/tripService.js';
import { validateRequired, validateDate, validateDateRange } from '../utils/validation.js';

export async function listTrips(req, res, next) {
  try {
    const trips = await tripService.getAllTrips();
    res.json(trips);
  } catch (err) { next(err); }
}

export async function getTrip(req, res, next) {
  try {
    const trip = await tripService.getTripById(req.params.tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) { next(err); }
}

export async function createTrip(req, res, next) {
  try {
    const { name, description, startDate, endDate } = req.body;
    const nameCheck = validateRequired(name, 'Trip name');
    if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });
    const dateCheck = validateDate(startDate, 'Start date');
    if (!dateCheck.valid) return res.status(400).json({ error: dateCheck.error });
    const rangeCheck = validateDateRange(startDate, endDate);
    if (!rangeCheck.valid) return res.status(400).json({ error: rangeCheck.error });

    const trip = await tripService.createTrip({ name, description, startDate, endDate });
    res.status(201).json(trip);
  } catch (err) { next(err); }
}

export async function updateTrip(req, res, next) {
  try {
    const { name, description, startDate, endDate } = req.body;
    const nameCheck = validateRequired(name, 'Trip name');
    if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });
    const dateCheck = validateDate(startDate, 'Start date');
    if (!dateCheck.valid) return res.status(400).json({ error: dateCheck.error });

    const trip = await tripService.updateTrip(req.params.tripId, { name, description, startDate, endDate });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) { next(err); }
}

export async function deleteTrip(req, res, next) {
  try {
    const deleted = await tripService.deleteTrip(req.params.tripId);
    if (!deleted) return res.status(404).json({ error: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    err.status = err.message.includes('Cannot delete') ? 400 : 500;
    next(err);
  }
}
