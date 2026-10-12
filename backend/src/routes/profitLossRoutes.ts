import { Router } from 'express';
import { getProfitLoss } from '../controllers/profitLossController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// GET /api/profit-loss  (admin only)
router.get('/', protect, adminOnly, getProfitLoss);

export default router;
