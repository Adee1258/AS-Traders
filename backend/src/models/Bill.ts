import mongoose, { Document, Schema } from 'mongoose';

// A bill can belong to either a Shop (customer) or a Supplier
export type BillPartyType = 'shop' | 'supplier';

// Bill source — how it was created
export type BillSource = 'manual' | 'auto_order' | 'auto_purchase';

export interface IBill extends Document {
  partyType: BillPartyType;
  partyId: mongoose.Types.ObjectId;   // shopId or supplierId
  partyName: string;                  // snapshot for quick display
  title: string;
  description: string;
  amount: number;
  billDate: Date;
  imageUrl: string | null;            // Cloudinary URL
  imagePublicId: string | null;       // Cloudinary public_id for deletion
  source: BillSource;
  referenceId: mongoose.Types.ObjectId | null;  // orderId or transactionId
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    partyType: {
      type: String,
      enum: ['shop', 'supplier'],
      required: true,
    },
    partyId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    partyName: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Bill title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'auto_order', 'auto_purchase'],
      default: 'manual',
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for date-wise filtering per party
BillSchema.index({ partyId: 1, billDate: -1 });
BillSchema.index({ partyType: 1, partyId: 1, billDate: -1 });

export default mongoose.model<IBill>('Bill', BillSchema);
