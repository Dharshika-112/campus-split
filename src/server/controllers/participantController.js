import * as participantService from '../services/participantService.js';
import { validateRequired } from '../utils/validation.js';

export async function listParticipants(req, res, next) {
  try {
    const participants = await participantService.getParticipants(req.params.tripId);
    res.json(participants);
  } catch (err) { next(err); }
}

export async function addParticipant(req, res, next) {
  try {
    const { name, email } = req.body;
    const nameCheck = validateRequired(name, 'Participant name');
    if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });

    const participant = await participantService.addParticipant(req.params.tripId, { name, email });
    res.status(201).json(participant);
  } catch (err) {
    if (err.message.includes('already exists')) {
      err.status = 409;
    }
    next(err);
  }
}

export async function updateParticipant(req, res, next) {
  try {
    const { name, email } = req.body;
    const nameCheck = validateRequired(name, 'Participant name');
    if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });

    const participant = await participantService.updateParticipant(req.params.participantId, { name, email });
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    res.json(participant);
  } catch (err) { next(err); }
}

export async function deleteParticipant(req, res, next) {
  try {
    const deleted = await participantService.deleteParticipant(req.params.participantId);
    if (!deleted) return res.status(404).json({ error: 'Participant not found' });
    res.json({ message: 'Participant removed' });
  } catch (err) {
    if (err.message.includes('Cannot remove')) err.status = 400;
    next(err);
  }
}
