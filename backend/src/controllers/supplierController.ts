import { Response } from 'express';
import mongoose from 'mongoose';
import Supplier from '../models/Supplier';
import SupplierTransaction from '../models/SupplierTransaction';
import { AuthRequest } from '../middleware/auth';

// ── Helper: last balance for a supplier ──────────────────────────────────
const getLastSupplierBalance = async (supplierId: string | mongoose.Types.ObjectId): Promise<number> => {
  const last = await SupplierTransaction.findOne({ supplierId })
    .sort({ createdAt: -1 })
    .lean();
  return last?.balanceAfter ?? 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suppliers  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ name: 1 }).lean();

    // Attach current balance to each supplier
    const withBalance = await Promise.all(
      suppliers.map(async (s) => {
        const balance = await getLastSupplierBalance(s._id as mongoose.Types.ObjectId);
        return { ...s, currentBalance: balance };
      })
    );

    // Summary totals
    const totalPayable = withBalance
      .filter((s) => s.currentBalance > 0)
      .reduce((sum, s) => sum + s.currentBalance, 0);
    const totalReceivable = withBalance
      .filter((s) => s.currentBalance < 0)
      .reduce((sum, s) => sum + Math.abs(s.currentBalance), 0);

    res.status(200).json({
      success: true,
      data: withBalance,
      meta: { totalPayable, totalReceivable },
    });
  } catch (error) {
    console.error('getAllSuppliers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suppliers/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }
    const balance = await getLastSupplierBalance(req.params.id);
    res.status(200).json({ success: true, data: { ...supplier, currentBalance: balance } });
  } catch (error) {
    console.error('getSupplierById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/suppliers  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerName, phone, address, description, openingBalance } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Supplier name is required' });
      return;
    }

    const supplier = await Supplier.create({
      name,
      ownerName: ownerName || '',
      phone: phone || '',
      address: address || '',
      description: description || '',
      openingBalance: Number(openingBalance) || 0,
    });

    // Create opening balance ledger entry if non-zero
    const opening = Number(openingBalance) || 0;
    if (opening !== 0) {
      await SupplierTransaction.create({
        supplierId: supplier._id,
        type: 'OPENING_BALANCE',
        amount: Math.abs(opening),
        debit: opening > 0 ? Math.abs(opening) : 0,
        credit: opening < 0 ? Math.abs(opening) : 0,
        balanceAfter: opening,
        description: 'Opening Balance',
        referenceNote: '',
        createdBy: req.user!._id,
      });
    }

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('createSupplier error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/suppliers/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerName, phone, address, description } = req.body;
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(ownerName !== undefined && { ownerName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    console.error('updateSupplier error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/suppliers/:id  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }
    await SupplierTransaction.deleteMany({ supplierId: req.params.id });
    await Supplier.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `Supplier "${supplier.name}" deleted` });
  } catch (error) {
    console.error('deleteSupplier error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suppliers/:id/ledger  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await SupplierTransaction.find({ supplierId: req.params.id })
      .sort({ createdAt: 1 })
      .lean();
    const currentBalance = transactions.length > 0
      ? transactions[transactions.length - 1].balanceAfter
      : 0;
    res.status(200).json({ success: true, data: { transactions, currentBalance } });
  } catch (error) {
    console.error('getSupplierLedger error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/suppliers/:id/transaction  (admin only)
// Add a purchase or payment transaction
// Body: { type, amount, description, referenceNote? }
// ─────────────────────────────────────────────────────────────────────────────
export const addSupplierTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, amount, description, referenceNote } = req.body;

    if (!type || !amount || !description) {
      res.status(400).json({ success: false, message: 'type, amount, description required' });
      return;
    }

    const validTypes = ['PURCHASE', 'PAYMENT_SENT', 'PAYMENT_RECEIVED', 'ADJUSTMENT'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
      return;
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    const prevBalance = await getLastSupplierBalance(req.params.id);

    // Balance logic:
    // PURCHASE        → balance badhta hai (hum zyada dene lagay) → debit
    // PAYMENT_SENT    → balance ghatta hai (humne diya) → credit
    // PAYMENT_RECEIVED → balance ghatta hai (unhone diya) → credit
    // ADJUSTMENT      → could be either — positive amount = debit, negative = credit
    let debit = 0;
    let credit = 0;
    let newBalance = prevBalance;

    if (type === 'PURCHASE') {
      debit = amt;
      newBalance = prevBalance + amt;
    } else if (type === 'PAYMENT_SENT' || type === 'PAYMENT_RECEIVED') {
      credit = amt;
      newBalance = prevBalance - amt;
    } else if (type === 'ADJUSTMENT') {
      debit = amt;
      newBalance = prevBalance + amt;
    }

    const txn = await SupplierTransaction.create({
      supplierId: req.params.id,
      type,
      amount: amt,
      debit,
      credit,
      balanceAfter: newBalance,
      description,
      referenceNote: referenceNote || '',
      createdBy: req.user!._id,
    });

    res.status(201).json({ success: true, data: txn });
  } catch (error) {
    console.error('addSupplierTransaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/suppliers/summary  (admin only)
// Total payable + receivable across all suppliers
// ─────────────────────────────────────────────────────────────────────────────
export const getSuppliersSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).lean();
    let totalPayable = 0;
    let totalReceivable = 0;

    await Promise.all(
      suppliers.map(async (s) => {
        const balance = await getLastSupplierBalance(s._id as mongoose.Types.ObjectId);
        if (balance > 0) totalPayable += balance;
        else if (balance < 0) totalReceivable += Math.abs(balance);
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalPayable: Math.round(totalPayable * 100) / 100,
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        netBalance: Math.round((totalPayable - totalReceivable) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('getSuppliersSummary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
