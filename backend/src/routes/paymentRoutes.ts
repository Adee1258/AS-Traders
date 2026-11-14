import { Router } from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
} from '../controllers/paymentController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect);

// GET /api/payments — admin sees ALL payments from all shops
router.get('/', adminOnly, getAllPayments);

// POST /api/payments — admin records a payment for a shop
router.post('/', adminOnly, createPayment);

// GET /api/payments/:id
router.get('/:id', getPaymentById);

// PUT /api/payments/:id — admin edits a payment
router.put('/:id', adminOnly, updatePayment);

export default router;
