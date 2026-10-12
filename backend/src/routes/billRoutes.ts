import { Router } from 'express';
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
} from '../controllers/billController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect, adminOnly);

router.get('/',       getBills);
router.post('/',      createBill);
router.put('/:id',    updateBill);
router.delete('/:id', deleteBill);

export default router;
