import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISale, ISaleDocument, ISaleItem } from '../src/types/models';

// 銷售項目 Schema
const SaleItemSchema = new Schema<ISaleItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'BaseProduct',
    required: [true, '產品為必填項目']
  },
  productName: {
    type: String,
    required: [true, '產品名稱為必填項目'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, '數量為必填項目'],
    min: [0.01, '數量必須大於0']
  },
  unitPrice: {
    type: Number,
    required: [true, '單價為必填項目'],
    min: [0, '單價不能為負數']
  },
  subtotal: {
    type: Number,
    required: [true, '小計為必填項目'],
    min: [0, '小計不能為負數']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, '折扣不能為負數']
  }
}, { _id: false });

// 銷售 Schema 定義
const SaleSchema = new Schema<ISaleDocument>({
  saleNumber: {
    type: String,
    required: [true, '銷售單號為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: {
    type: [SaleItemSchema],
    required: [true, '銷售項目為必填項目'],
    validate: {
      validator: function(items: ISaleItem[]) {
        return items && items.length > 0;
      },
      message: '至少需要一個銷售項目'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, '總金額為必填項目'],
    min: [0, '總金額不能為負數']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, '折扣金額不能為負數']
  },
  finalAmount: {
    type: Number,
    required: [true, '最終金額為必填項目'],
    min: [0, '最終金額不能為負數']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'transfer', 'other'],
      message: '付款方式必須是 cash、card、transfer 或 other'
    },
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'refunded'],
      message: '付款狀態必須是 pending、paid 或 refunded'
    },
    default: 'paid'
  },
  saleDate: {
    type: Date,
    required: [true, '銷售日期為必填項目'],
    default: Date.now
  },
  cashier: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '收銀員為必填項目']
  },
  notes: {
    type: String,
    maxlength: [500, '備註不能超過500個字元']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引設定
SaleSchema.index({ saleNumber: 1 }, { unique: true });
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ cashier: 1 });
SaleSchema.index({ customer: 1 });
SaleSchema.index({ paymentStatus: 1 });
SaleSchema.index({ paymentMethod: 1 });
SaleSchema.index({ 'items.product': 1 });

// 複合索引
SaleSchema.index({ saleDate: -1, cashier: 1 });
SaleSchema.index({ saleDate: -1, paymentStatus: 1 });

// 靜態方法：根據銷售單號查找
SaleSchema.statics.findBySaleNumber = function(saleNumber: string) {
  return this.findOne({ saleNumber: saleNumber.toUpperCase() })
    .populate('customer', 'name phone')
    .populate('cashier', 'username')
    .populate('items.product', 'productCode productName');
};

// 靜態方法：根據日期範圍查找銷售
SaleSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, options: any = {}) {
  const query: any = {
    saleDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (options.cashier) {
    query.cashier = options.cashier;
  }

  if (options.paymentStatus) {
    query.paymentStatus = options.paymentStatus;
  }

  if (options.paymentMethod) {
    query.paymentMethod = options.paymentMethod;
  }

  return this.find(query)
    .populate('customer', 'name')
    .populate('cashier', 'username')
    .sort({ saleDate: -1 })
    .limit(options.limit || 100);
};

// 靜態方法：計算日期範圍內的銷售統計
SaleSchema.statics.getSalesStats = async function(startDate: Date, endDate: Date) {
  const stats = await this.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$finalAmount' },
        averageOrderValue: { $avg: '$finalAmount' },
        totalItems: { $sum: { $size: '$items' } }
      }
    }
  ]);

  return stats[0] || {
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0
  };
};

// 靜態方法：獲取熱銷產品
SaleSchema.statics.getTopProducts = async function(startDate: Date, endDate: Date, limit: number = 10) {
  return await this.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
        salesCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'baseproducts',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productCode: '$product.productCode',
        productName: '$productName',
        totalQuantity: 1,
        totalRevenue: 1,
        salesCount: 1,
        averagePrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
      }
    }
  ]);
};

// 實例方法：計算總金額
SaleSchema.methods.calculateTotalAmount = function(): number {
  return this.items.reduce((total: number, item: ISaleItem) => {
    return total + (item.subtotal - (item.discount || 0));
  }, 0);
};

// 實例方法：驗證項目小計
SaleSchema.methods.validateItemSubtotals = function(): boolean {
  return this.items.every((item: ISaleItem) => {
    const expectedSubtotal = item.quantity * item.unitPrice;
    return Math.abs(item.subtotal - expectedSubtotal) < 0.01; // 允許小數點誤差
  });
};

// 虛擬屬性：項目總數
SaleSchema.virtual('totalItems').get(function(this: ISaleDocument) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 虛擬屬性：平均項目價格
SaleSchema.virtual('averageItemPrice').get(function(this: ISaleDocument) {
  if (this.items.length === 0) return 0;
  const totalValue = this.items.reduce((total, item) => total + item.subtotal, 0);
  const totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
});

// 中間件：銷售單號自動轉大寫
SaleSchema.pre<ISaleDocument>('save', function(next) {
  if (this.saleNumber) {
    this.saleNumber = this.saleNumber.toUpperCase();
  }
  next();
});

// 中間件：驗證金額計算
SaleSchema.pre<ISaleDocument>('save', function(next) {
  // 驗證項目小計
  if (!this.validateItemSubtotals()) {
    return next(new Error('項目小計計算錯誤'));
  }

  // 計算並驗證總金額
  const calculatedTotal = this.calculateTotalAmount();
  this.totalAmount = calculatedTotal;
  this.finalAmount = calculatedTotal - (this.discountAmount || 0);

  if (this.finalAmount < 0) {
    return next(new Error('最終金額不能為負數'));
  }

  next();
});

// 中間件：更新庫存（銷售後）
SaleSchema.post<ISaleDocument>('save', async function(doc) {
  if (doc.paymentStatus === 'paid') {
    // 這裡可以觸發庫存更新邏輯
    // 實際實現時需要調用庫存服務
    console.log(`銷售 ${doc.saleNumber} 已完成，需要更新庫存`);
  }
});

// 擴展靜態方法介面
interface ISaleModel extends Model<ISaleDocument> {
  findBySaleNumber(saleNumber: string): Promise<ISaleDocument | null>;
  findByDateRange(startDate: Date, endDate: Date, options?: any): Promise<ISaleDocument[]>;
  getSalesStats(startDate: Date, endDate: Date): Promise<any>;
  getTopProducts(startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
}

// 創建並匯出模型
const Sale = mongoose.model<ISaleDocument, ISaleModel>('Sale', SaleSchema);

export default Sale;
export { ISale, ISaleDocument, ISaleItem, ISaleModel };