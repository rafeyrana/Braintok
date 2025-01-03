import { Router } from 'express';
import { WaitlistController } from '../controllers/waitlist.controller';

const router = Router();

router.post('/submit', WaitlistController.submitEntry);
router.get('/entries', WaitlistController.getAllEntries);

export default router;




