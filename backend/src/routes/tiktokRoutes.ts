import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tiktokController } from '../controllers/tiktokController';
const router: Router = express.Router();

router.use((req, res, next) => {
    Promise.resolve(authenticateToken(req, res, next)).catch(next);
  });
console.log("tiktokRoutes made here")
router.get('/build-tiktok', tiktokController.buildTiktok)
export default router;