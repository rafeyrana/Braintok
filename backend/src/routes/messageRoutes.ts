import express, { Router } from 'express';
import { messagesController } from '../controllers/messagesController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.use((req, res, next) => {
    Promise.resolve(authenticateToken(req, res, next)).catch(next);
  });
  
router.get('/fetch-all-messages', messagesController.getAllMessages);

export default router;