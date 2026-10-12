import mongoose, { Document, Schema } from 'mongoose';

// Transaction types:
//   OPENING_BALANCE  — initial balance entry
//   PURCHASE         — humne unse maal kharida  → balance badha (hum unhe dete hain)
//   PAYMENT_SENT     — humne unhe paisa diya     → balance ghata (humara payable kama)
//   PAYMENT_RECEIVED — unhone humein paisa diya  → balance ghata (hamare receivable kama)
//   ADJUSTMENT       — manual correction
export type SupplierTransactionType =
  | 'OPENING_BALANCE'
  | 'PURCHASE'
  | 'PAYMENT_SENT'
  | 'PAYMENT_RECEIVED'
  | 'ADJUSTMENT';

export interface ISupplierTransaction extends Document {
  supplierId: mongoose.Types.ObjectId;
  type: SupplierTransactionType;
  amount: number;       // always positive
  // debit  = balance badhna (hum unhe zyada dene lagay)
  // credit = balance ghata  (humara payable kama)
  debit: number;
  credit: number;
  balanceAfter: number; // running balance snapshot
  description: string;
  referenceNote: string;
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const SupplierTransactionSchema = new Schema<ISupplierTransaction>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    type: {
      type: String,
      enum: ['OPENING_BALANCE', 'PURCHASE', 'PAYMENT_SENT', 'PAYMENT_RECEIVED', 'ADJUSTMENT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    referenceNote: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SupplierTransactionSchema.index({ supplierId: 1, createdAt: -1 });

export default mongoose.model<ISupplierTransaction>('SupplierTransaction', SupplierTransactionSchema);
