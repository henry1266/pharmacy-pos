import mongoose, { Schema, Document, Model } from 'mongoose';
import { IShippingOrder, IShippingOrderDocument, IShippingOrderItem } from '../src/types/models';

// 出貨單項目 Schema
const ShippingOrderItemSchema = new Schema<IShippingOrderItem>({
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
    min: [0, '單價不能為負數']
  },
  subtotal: {
    type: Number,
    min: [0, '小計不能為負數']
  }
}, { _id: false });

// 出貨單主 Schema
const ShippingOrderSchema = new Schema<IShippingOrderDocument>({
  orderNumber: {
    type: String,
    required: [true, '訂單號為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, '客戶名稱不能超過100個字元']
  },
  items: {
    type: [ShippingOrderItemSchema],
    required: [true, '出貨項目為必填項目'],
    validate: {
      validator: function(items: IShippingOrderItem[]) {
        return items && items.length > 0;
      },
      message: '至少需要一個出貨項目'
    }
  },
  totalAmount: {
    type: Number,
    min: [0, '總金額不能為負數']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: '狀態必須是 pending、processing、shipped、delivered 或 cancelled'
    },
    default: 'pending'
  },
  shippingDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  shippingAddress: {
    type: String,
    maxlength: [500, '出貨地址不能超過500個字元']
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: [50, '追蹤號碼不能超過50個字元']
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
ShippingOrderSchema.index({ orderNumber: 1 }, { unique: true });
ShippingOrderSchema.index({ customer: 1 });
ShippingOrderSchema.index({ status: 1 });
ShippingOrderSchema.index({ shippingDate: -1 });
ShippingOrderSchema.index({ deliveryDate: -1 });
ShippingOrderSchema.index({ createdBy: 1 });
ShippingOrderSchema.index({ trackingNumber: 1 }, { sparse: true });
ShippingOrderSchema.index({ 'items.product': 1 });

// 複合索引
ShippingOrderSchema.index({ customer: 1, shippingDate: -1 });
ShippingOrderSchema.index({ status: 1, shippingDate: -1 });

// 靜態方法：根據訂單號查找
ShippingOrderSchema.statics.findByOrderNumber = function(orderNumber: string) {
  return this.findOne({ orderNumber: orderNumber.toUpperCase() })
    .populate('customer', 'name phone email')
    .populate('createdBy', 'username')
    .populate('items.product', 'productCode productName unit');
};

// 靜態方法：根據客戶查找訂單
ShippingOrderSchema.statics.findByCustomer = function(customerId: string, options: any = {}) {
  const query: any = { customer: customerId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.startDate && options.endDate) {
    query.shippingDate = {
      $gte: options.startDate,
      $lte: options.endDate
    };
  }

  return this.find(query)
    .populate('customer', 'name')
    .populate('createdBy', 'username')
    .sort({ shippingDate: -1 })
    .limit(options.limit || 100);
};

// 靜態方法：根據追蹤號碼查找
ShippingOrderSchema.statics.findByTrackingNumber = function(trackingNumber: string) {
  return this.findOne({ trackingNumber })
    .populate('customer', 'name phone')
    .populate('items.product', 'productCode productName');
};

// 靜態方法：根據日期範圍查找訂單
ShippingOrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, options: any = {}) {
  const query: any = {
    shippingDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (options.customer) {
    query.customer = options.customer;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('customer', 'name')
    .populate('createdBy', 'username')
    .sort({ shippingDate: -1 })
    .limit(options.limit || 100);
};

// 靜態方法：獲取出貨統計
ShippingOrderSchema.statics.getShippingStats = async function(startDate: Date, endDate: Date) {
  const stats = await this.aggregate([
    {
      $match: {
        shippingDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalItems: { $sum: { $size: '$items' } },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    totalItems: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  };
};

// 靜態方法：獲取客戶出貨統計
ShippingOrderSchema.statics.getCustomerShippingStats = async function(startDate: Date, endDate: Date, limit: number = 10) {
  return await this.aggregate([
    {
      $match: {
        shippingDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$customer',
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        lastShippingDate: { $max: '$shippingDate' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerName: '$customer.name',
        totalOrders: 1,
        totalAmount: 1,
        averageOrderValue: 1,
        lastShippingDate: 1
      }
    }
  ]);
};

// 實例方法：計算總金額
ShippingOrderSchema.methods.calculateTotalAmount = function(): number {
  return this.items.reduce((total: number, item: IShippingOrderItem) => {
    return total + (item.subtotal || 0);
  }, 0);
};

// 實例方法：更新狀態
ShippingOrderSchema.methods.updateStatus = function(newStatus: string, date?: Date): void {
  this.status = newStatus;
  
  if (newStatus === 'shipped' && date) {
    this.shippingDate = date;
  } else if (newStatus === 'delivered' && date) {
    this.deliveryDate = date;
  }
};

// 實例方法：設定追蹤號碼
ShippingOrderSchema.methods.setTrackingNumber = function(trackingNumber: string): void {
  this.trackingNumber = trackingNumber;
  if (this.status === 'pending') {
    this.status = 'processing';
  }
};

// 實例方法：檢查是否逾期
ShippingOrderSchema.methods.isOverdue = function(): boolean {
  if (!this.shippingDate || this.status === 'delivered' || this.status === 'cancelled') {
    return false;
  }
  
  // 假設標準配送時間為7天
  const expectedDeliveryDate = new Date(this.shippingDate);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
  
  return new Date() > expectedDeliveryDate && this.status !== 'delivered';
};

// 實例方法：獲取配送天數
ShippingOrderSchema.methods.getDeliveryDays = function(): number | null {
  if (!this.shippingDate || !this.deliveryDate) {
    return null;
  }
  
  const diffTime = this.deliveryDate.getTime() - this.shippingDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 虛擬屬性：項目總數
ShippingOrderSchema.virtual('totalItems').get(function(this: IShippingOrderDocument) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 虛擬屬性：平均項目價格
ShippingOrderSchema.virtual('averageItemPrice').get(function(this: IShippingOrderDocument) {
  if (this.items.length === 0) return 0;
  const totalValue = this.items.reduce((total, item) => total + (item.subtotal || 0), 0);
  const totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
});

// 虛擬屬性：狀態顯示名稱
ShippingOrderSchema.virtual('statusDisplay').get(function(this: IShippingOrderDocument) {
  const statusMap: { [key: string]: string } = {
    pending: '待處理',
    processing: '處理中',
    shipped: '已出貨',
    delivered: '已送達',
    cancelled: '已取消'
  };
  return statusMap[this.status] || this.status;
});

// 虛擬屬性：配送進度
ShippingOrderSchema.virtual('deliveryProgress').get(function(this: IShippingOrderDocument) {
  const progressMap: { [key: string]: number } = {
    pending: 0,
    processing: 25,
    shipped: 75,
    delivered: 100,
    cancelled: 0
  };
  return progressMap[this.status] || 0;
});

// 中間件：訂單號自動轉大寫
ShippingOrderSchema.pre<IShippingOrderDocument>('save', function(next) {
  if (this.orderNumber) {
    this.orderNumber = this.orderNumber.toUpperCase();
  }
  next();
});

// 中間件：計算總金額
ShippingOrderSchema.pre<IShippingOrderDocument>('save', function(next) {
  // 計算總金額
  this.totalAmount = this.calculateTotalAmount();
  next();
});

// 中間件：狀態變更驗證
ShippingOrderSchema.pre<IShippingOrderDocument>('save', function(next) {
  if (this.isModified('status')) {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };

    // 在新文檔創建時，無法獲取原始狀態，直接允許
    if (this.isNew) {
      return next();
    }

    // 對於現有文檔，驗證狀態轉換
    const currentStatus = this.status;
    const allowedTransitions = validTransitions[currentStatus] || [];
    
    // 這裡簡化處理，實際應用中可以加入更嚴格的驗證
    if (currentStatus === 'delivered' && this.status !== 'delivered') {
      return next(new Error('已送達的訂單無法變更狀態'));
    }
  }

  next();
});

// 擴展靜態方法介面
interface IShippingOrderModel extends Model<IShippingOrderDocument> {
  findByOrderNumber(orderNumber: string): Promise<IShippingOrderDocument | null>;
  findByCustomer(customerId: string, options?: any): Promise<IShippingOrderDocument[]>;
  findByTrackingNumber(trackingNumber: string): Promise<IShippingOrderDocument | null>;
  findByDateRange(startDate: Date, endDate: Date, options?: any): Promise<IShippingOrderDocument[]>;
  getShippingStats(startDate: Date, endDate: Date): Promise<any>;
  getCustomerShippingStats(startDate: Date, endDate: Date, limit?: number): Promise<any[]>;
}

// 創建並匯出模型
const ShippingOrder = mongoose.model<IShippingOrderDocument, IShippingOrderModel>('ShippingOrder', ShippingOrderSchema);

export default ShippingOrder;
export type { IShippingOrder, IShippingOrderDocument, IShippingOrderItem, IShippingOrderModel };