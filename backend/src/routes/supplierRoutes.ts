import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
  addSupplierTransaction,
  getSuppliersSummary,
} from '../controllers/supplierController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.use(protect, adminOnly);

// Summary (before /:id routes to avoid conflict)
router.get('/summary', getSuppliersSummary);

// CRUD
router.get('/', getAllSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

// Ledger
router.get('/:id/ledger', getSupplierLedger);
router.post('/:id/transaction', addSupplierTransaction);

export default router;
