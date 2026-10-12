import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderBill,
} from '../controllers/orderController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect);

// GET /api/orders — admin sees ALL orders from all shops
router.get('/', adminOnly, getAllOrders);

// POST /api/orders — admin creates an order for a shop
router.post('/', adminOnly, createOrder);

// GET /api/orders/:id — admin or customer (customer checked inside controller)
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/bill — admin attaches physical bill photo + description
router.patch('/:id/bill', adminOnly, updateOrderBill);

export default router;
