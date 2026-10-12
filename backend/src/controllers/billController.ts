import { Response } from 'express';
import mongoose from 'mongoose';
import Bill from '../models/Bill';
import Shop from '../models/Shop';
import Supplier from '../models/Supplier';
import { AuthRequest } from '../middleware/auth';
import { uploadImage, deleteImage } from '../utils/cloudinary';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bills?partyType=shop&partyId=xxx&dateFrom=&dateTo=&page=&limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getBills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partyType, partyId, dateFrom, dateTo } = req.query as Record<string, string>;
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

    if (!partyType || !partyId) {
      res.status(400).json({ success: false, message: 'partyType and partyId required' });
      return;
    }

    const filter: Record<string, unknown> = {
      partyType,
      partyId: new mongoose.Types.ObjectId(partyId),
    };

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.billDate = dateFilter;
    }

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .sort({ billDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Bill.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: bills,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getBills error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bills  — create new bill (manual upload)
// Body: { partyType, partyId, title, description?, amount?, billDate?, imageBase64? }
// ─────────────────────────────────────────────────────────────────────────────
export const createBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      partyType, partyId, title, description,
      amount, billDate, imageBase64,
    } = req.body;

    if (!partyType || !partyId || !title) {
      res.status(400).json({ success: false, message: 'partyType, partyId, title zaroori hain' });
      return;
    }

    if (!['shop', 'supplier'].includes(partyType)) {
      res.status(400).json({ success: false, message: 'partyType must be shop or supplier' });
      return;
    }

    // Validate size — base64 ~1.37x raw
    if (imageBase64 && imageBase64.length > 10 * 1024 * 1024) {
      res.status(413).json({ success: false, message: 'Image too large (max ~7MB)' });
      return;
    }

    // Resolve party name
    let partyName = '';
    if (partyType === 'shop') {
      const shop = await Shop.findById(partyId).lean();
      partyName = shop?.name ?? '';
    } else {
      const supplier = await Supplier.findById(partyId).lean();
      partyName = supplier?.name ?? '';
    }

    // Upload image to Cloudinary if provided
    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    if (imageBase64) {
      const uploaded = await uploadImage(imageBase64, 'as_traders_bills');
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const bill = await Bill.create({
      partyType,
      partyId,
      partyName,
      title: title.trim(),
      description: description?.trim() ?? '',
      amount: Number(amount) || 0,
      billDate: billDate ? new Date(billDate) : new Date(),
      imageUrl,
      imagePublicId,
      source: 'manual',
      referenceId: null,
      createdBy: req.user!._id,
    });

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    console.error('createBill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bills/:id  — update bill (title, description, amount, date, image)
// ─────────────────────────────────────────────────────────────────────────────
export const updateBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, amount, billDate, imageBase64 } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    // Update image if new one provided
    if (imageBase64) {
      if (imageBase64.length > 10 * 1024 * 1024) {
        res.status(413).json({ success: false, message: 'Image too large (max ~7MB)' });
        return;
      }
      // Delete old image from Cloudinary
      if (bill.imagePublicId) {
        await deleteImage(bill.imagePublicId).catch(() => {});
      }
      const uploaded = await uploadImage(imageBase64, 'as_traders_bills');
      bill.imageUrl = uploaded.url;
      bill.imagePublicId = uploaded.publicId;
    }

    if (title !== undefined) bill.title = title.trim();
    if (description !== undefined) bill.description = description.trim();
    if (amount !== undefined) bill.amount = Number(amount) || 0;
    if (billDate !== undefined) bill.billDate = new Date(billDate);

    await bill.save();
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    console.error('updateBill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/bills/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    // Delete from Cloudinary
    if (bill.imagePublicId) {
      await deleteImage(bill.imagePublicId).catch(() => {});
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    console.error('deleteBill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper — called by orderController after order creation
// ─────────────────────────────────────────────────────────────────────────────
export const createAutoBill = async ({
  partyType,
  partyId,
  partyName,
  title,
  description,
  amount,
  billDate,
  referenceId,
  createdBy,
  source = 'auto_order',
}: {
  partyType: 'shop' | 'supplier';
  partyId: mongoose.Types.ObjectId | string;
  partyName: string;
  title: string;
  description: string;
  amount: number;
  billDate: Date;
  referenceId: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId | null;
  source?: 'auto_order' | 'auto_purchase';
}): Promise<void> => {
  await Bill.create({
    partyType,
    partyId,
    partyName,
    title,
    description,
    amount,
    billDate,
    imageUrl: null,
    imagePublicId: null,
    source,
    referenceId,
    createdBy,
  });
};
