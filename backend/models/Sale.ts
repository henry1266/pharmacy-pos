import { Schema, model } from 'mongoose';
import { ISaleDocument } from '../src/types/models';

const SaleSchema = new Schema<ISaleDocument>({
  saleNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'customer'
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'baseproduct',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      subtotal: {
        type: Number,
        required: true
      },
      note: {
        type: String
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'mobile_payment', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'cancelled'],
    default: 'paid'
  },
  notes: {
    type: String
  },
  cashier: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 實例方法
SaleSchema.methods.calculateTotalAmount = function(): number {
  return this.items.reduce((total: number, item: any) => total + item.subtotal, 0) - (this.discount ?? 0);
};

SaleSchema.methods.validateItemSubtotals = function(): boolean {
  return this.items.every((item: any) => {
    const expectedSubtotal = item.quantity * item.price;
    return Math.abs(item.subtotal - expectedSubtotal) < 0.01; // 允許小數點誤差
  });
};

// 虛擬屬性
SaleSchema.virtual('finalAmount').get(function() {
  return this.totalAmount - (this.discount ?? 0);
});

SaleSchema.virtual('saleDate').get(function() {
  return this.date;
});

// 確保虛擬屬性在 JSON 序列化時包含
SaleSchema.set('toJSON', { virtuals: true });
SaleSchema.set('toObject', { virtuals: true });

const Sale = model<ISaleDocument>('sale', SaleSchema);

// 同時支持 ES6 和 CommonJS 導入
export default Sale;
module.exports = Sale;
module.exports.default = Sale;