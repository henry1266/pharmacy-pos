import { Schema, model } from 'mongoose';
import { ISaleDocument } from '../src/types/models';

const SaleSchema = new Schema<ISaleDocument>({
  saleNumber: {
    type: String,
    unique: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customer',
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'baseproduct',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      note: {
        type: String,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'mobile_payment', 'other'],
    default: 'cash',
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'cancelled'],
    default: 'paid',
  },
  notes: {
    type: String,
    alias: 'note',
  },
  cashier: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

SaleSchema.methods.calculateTotalAmount = function calculateTotalAmount(): number {
  return this.items.reduce((total: number, item: any) => total + item.subtotal, 0) - (this.discount ?? 0);
};

SaleSchema.methods.validateItemSubtotals = function validateItemSubtotals(): boolean {
  return this.items.every((item: any) => {
    const expectedSubtotal = item.quantity * item.price;
    return Math.abs(item.subtotal - expectedSubtotal) < 0.01;
  });
};

SaleSchema.virtual('finalAmount').get(function finalAmountAccessor() {
  return this.totalAmount - (this.discount ?? 0);
});

SaleSchema.virtual('saleDate').get(function saleDateAccessor() {
  return this.date;
});

SaleSchema.pre('validate', function saleAliasPreHook(next) {
  const doc = this as any;

  if (doc.note !== undefined && doc.notes === undefined) {
    doc.notes = doc.note;
  }

  if (Array.isArray(doc.items)) {
    doc.items = doc.items.map((item: any) => {
      if (item && item.notes !== undefined && item.note === undefined) {
        item.note = item.notes;
      }
      return item;
    });
  }

  next();
});

SaleSchema.set('toJSON', { virtuals: true });
SaleSchema.set('toObject', { virtuals: true });

const Sale = model<ISaleDocument>('sale', SaleSchema);

export default Sale;
module.exports = Sale;
module.exports.default = Sale;
