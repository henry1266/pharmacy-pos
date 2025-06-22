import mongoose, { Schema, Document, Model } from 'mongoose';
import { IPurchaseOrder, IPurchaseOrderDocument, IPurchaseOrderItem } from '../src/types/models';

// 進貨單項目 Schema
const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
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
  }
}, { _id: false });

// 進貨單主 Schema
const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>({
  orderNumber: {
    type: String,
    required: [true, '訂單號為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, '供應商為必填項目']
  },
  items: {
    type: [PurchaseOrderItemSchema],
    required: [true, '進貨項目為必填項目'],
    validate: {
      validator: function(items: IPurchaseOrderItem[]) {
        return items && items.length > 0;
      },
      message: '至少需要一個進貨項目'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, '總金額為必填項目'],
    min: [0, '總金額不能為負數']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'ordered', 'received', 'cancelled'],
      message: '狀態必須是 pending、ordered、received 或 cancelled'
    },
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: [true, '訂單日期為必填項目'],
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '建立者為必填項目']
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
PurchaseOrderSchema.index({ orderNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ supplier: 1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ orderDate: -1 });
PurchaseOrderSchema.index({ createdBy: 1 });
PurchaseOrderSchema.index({ 'items.product': 1 });

// 複合索引
PurchaseOrderSchema.index({ supplier: 1, orderDate: -1 });
PurchaseOrderSchema.index({ status: 1, orderDate: -1 });

// 靜態方法：根據訂單號查找
PurchaseOrderSchema.statics.findByOrderNumber = function(orderNumber: string) {
  return this.findOne({ orderNumber: orderNumber.toUpperCase() })
    .populate('supplier', 'name contactPerson phone email')
    .populate('createdBy', 'username')
    .populate('items.product', 'productCode productName unit');
};

// 靜態方法：根據供應商查找訂單
PurchaseOrderSchema.statics.findBySupplier = function(supplierId: string, options: any = {}) {
  const query: any = { supplier: supplierId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.startDate && options.endDate) {
    query.orderDate = {
      $gte: options.startDate,
      $lte: options.endDate
    };
  }

  return this.find(query)
    .populate('supplier', 'name')
    .populate('createdBy', 'username')
    .sort({ orderDate: -1 })
    .limit(options.limit || 100);
};

// 靜態方法：根據日期範圍查找訂單
PurchaseOrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, options: any = {}) {
  const query: any = {
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (options.supplier) {
    query.supplier = options.supplier;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('supplier', 'name')
    .populate('createdBy', 'username')
    .sort({ orderDate: -1 })
    .limit(options.limit || 100);
};

// 靜態方法：獲取採購統計
PurchaseOrderSchema.statics.getPurchaseStats = async function(startDate: Date, endDate: Date) {
  const stats = await this.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    totalItems: 0
  };
};

// 靜態方法：獲取供應商採購統計
PurchaseOrderSchema.statics.getSupplierPurchaseStats = async function(startDate: Date, endDate: Date, limit: number = 10) {
  return await this.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$supplier',
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        lastOrderDate: { $max: '$orderDate' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier'
      }
    },
    { $unwind: '$supplier' },
    {
      $project: {
        supplierName: '$supplier.name',
        totalOrders: 1,
        totalAmount: 1,
        averageOrderValue: 1,
        lastOrderDate: 1
      }
    }
  ]);
};

// 實例方法：計算總金額
PurchaseOrderSchema.methods.calculateTotalAmount = function(): number {
  return this.items.reduce((total: number, item: IPurchaseOrderItem) => {
    return total + item.subtotal;
  }, 0);
};

// 實例方法：驗證項目小計
PurchaseOrderSchema.methods.validateItemSubtotals = function(): boolean {
  return this.items.every((item: IPurchaseOrderItem) => {
    const expectedSubtotal = item.quantity * item.unitPrice;
    return Math.abs(item.subtotal - expectedSubtotal) < 0.01; // 允許小數點誤差
  });
};

// 實例方法：更新狀態
PurchaseOrderSchema.methods.updateStatus = function(newStatus: string, deliveryDate?: Date): void {
  this.status = newStatus;
  
  if (newStatus === 'received' && deliveryDate) {
    this.actualDeliveryDate = deliveryDate;
  }
};

// 實例方法：檢查是否逾期
PurchaseOrderSchema.methods.isOverdue = function(): boolean {
  if (!this.expectedDeliveryDate || this.status === 'received' || this.status === 'cancelled') {
    return false;
  }
  
  return new Date() > this.expectedDeliveryDate;
};

// 虛擬屬性：項目總數
PurchaseOrderSchema.virtual('totalItems').get(function(this: IPurchaseOrderDocument) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 虛擬屬性：平均項目價格
PurchaseOrderSchema.virtual('averageItemPrice').get(function(this: IPurchaseOrderDocument) {
  if (this.items.length === 0) return 0;
  const totalValue = this.items.reduce((total, item) => total + item.subtotal, 0);
  const totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
});

// 虛擬屬性：預計交貨天數
PurchaseOrderSchema.virtual('expectedDeliveryDays').get(function(this: IPurchaseOrderDocument) {
  if (!this.expectedDeliveryDate) return null;
  const diffTime = this.expectedDeliveryDate.getTime() - this.orderDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 虛擬屬性：狀態顯示名稱
PurchaseOrderSchema.virtual('statusDisplay').get(function(this: IPurchaseOrderDocument) {
  const statusMap: { [key: string]: string } = {
    pending: '待處理',
    ordered: '已下單',
    received: '已收貨',
    cancelled: '已取消'
  };
  return statusMap[this.status] || this.status;
});

// 中間件：訂單號自動轉大寫
PurchaseOrderSchema.pre<IPurchaseOrderDocument>('save', function(next) {
  if (this.orderNumber) {
    this.orderNumber = this.orderNumber.toUpperCase();
  }
  next();
});

// 中間件：驗證和計算總金額
PurchaseOrderSchema.pre<IPurchaseOrderDocument>('save', function(next) {
  // 驗證項目小計
  if (!this.validateItemSubtotals()) {
    return next(new Error('項目小計計算錯誤'));
  }

  // 計算並更新總金額
  this.totalAmount = this.calculateTotalAmount();

  if (this.totalAmount < 0) {
    return next(new Error('總金額不能為負數'));
  }

  next();
});

// 中間件：狀態變更驗證
PurchaseOrderSchema.pre<IPurchaseOrderDocument>('save', function(next) {
  if (this.isModified('status')) {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['ordered', 'cancelled'],
      ordered: ['received', 'cancelled'],
      received: [],
      cancelled: []
    };

    const currentStatus = this.status;
    // 在新文檔創建時，無法獲取原始狀態，直接允許
    if (this.isNew) {
      return next();
    }
    
    // 對於現有文檔，我們簡化狀態轉換驗證
    const originalStatus = this.status;

    if (originalStatus !== currentStatus) {
      const allowedTransitions = validTransitions[originalStatus] || [];
      if (!allowedTransitions.includes(currentStatus)) {
        return next(new Error(`無法從 ${originalStatus} 狀態變更為 ${currentStatus}`));
      }
    }
  }

  next();
});

// 擴展靜態方法介面
interface IPurchaseOrderModel extends Model<IPurchaseOrderDocument> {
  findByOrderNumber(orderNumber: string): Promise<IPurchaseOrderDocument | null>;
  findBySupplier(supplierId: string, options?: any): Promise<IPurchaseOrderDocument[]>;
  findByDateRange(startDate: Date, endDate: Date, options?: any): Promise<IPurchaseOrderDocument[]>;
  getPurchaseStats(startDate: Date, endDate: Date): Promise<any>;
  getSupplierPurchaseStats(startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
}

// 創建並匯出模型
const PurchaseOrder = mongoose.model<IPurchaseOrderDocument, IPurchaseOrderModel>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
export type { IPurchaseOrder, IPurchaseOrderDocument, IPurchaseOrderItem, IPurchaseOrderModel };