import { Router } from 'express';
import * as participantCtrl from '../controllers/participantController.js';

const router = Router();

router.patch ('/:participantId', participantCtrl.updateParticipant);
router.delete('/:participantId', participantCtrl.deleteParticipant);

export default router;
