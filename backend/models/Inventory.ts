import mongoose, { Schema } from 'mongoose';
import { IInventory, IInventoryDocument } from '../src/types/models';

const InventorySchema = new Schema<IInventoryDocument>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "baseproduct", // 修改為正確的引用 "baseproduct"
    required: true,
    index: true // 為 product 添加索引以優化查詢
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  purchaseOrderId: {
    type: Schema.Types.ObjectId,
    ref: "purchaseorder"
  },
  purchaseOrderNumber: {
    type: String
  },
  type: {
    type: String,
    enum: ["purchase", "sale", "return", "adjustment", "ship"],
    default: "purchase",
    index: true // 為 type 添加索引
  },
  saleId: {
    type: Schema.Types.ObjectId,
    ref: "sale"
  },
  saleNumber: {
    type: String
  },
  shippingOrderId: {
    type: Schema.Types.ObjectId,
    ref: "shippingorder"
  },
  shippingOrderNumber: {
    type: String
  },
  accountingId: { // 新增欄位，用於連結到記帳記錄
    type: Schema.Types.ObjectId,
    ref: "Accounting",
    index: true, // 為 accountingId 添加索引
    default: null // 預設為 null，表示未連結
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true // 為 lastUpdated 添加索引
  }
});

// 實例方法：計算產品的運行餘額
InventorySchema.methods.calculateRunningBalance = async function(
  this: IInventoryDocument
): Promise<number> {
  const InventoryModel = this.constructor as mongoose.Model<IInventoryDocument>;
  
  const movements = await InventoryModel.find({
    product: this.product,
    lastUpdated: { $lte: this.lastUpdated }
  }).sort({ lastUpdated: 1 });

  let balance = 0;
  for (const movement of movements) {
    switch (movement.type) {
      case 'purchase':
      case 'return':
        balance += movement.quantity;
        break;
      case 'sale':
      case 'ship':
        balance -= movement.quantity;
        break;
      case 'adjustment':
        balance += movement.quantity; // 調整可能是正數或負數
        break;
    }
  }

  return balance;
};

// 實例方法：獲取相關交易統計
InventorySchema.methods.getRelatedTransactions = async function(
  this: IInventoryDocument
): Promise<{
  purchases: number;
  sales: number;
  adjustments: number;
}> {
  const InventoryModel = this.constructor as mongoose.Model<IInventoryDocument>;
  
  const [purchases, sales, adjustments] = await Promise.all([
    InventoryModel.aggregate([
      { $match: { product: this.product, type: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]),
    InventoryModel.aggregate([
      { $match: { product: this.product, type: { $in: ['sale', 'ship'] } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]),
    InventoryModel.aggregate([
      { $match: { product: this.product, type: 'adjustment' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ])
  ]);

  return {
    purchases: purchases[0]?.total || 0,
    sales: sales[0]?.total || 0,
    adjustments: adjustments[0]?.total || 0
  };
};

// 靜態方法：獲取產品當前庫存
InventorySchema.statics.getCurrentStock = async function(productId: mongoose.Types.ObjectId): Promise<number> {
  const movements = await this.find({ product: productId }).sort({ lastUpdated: 1 });
  
  let stock = 0;
  for (const movement of movements) {
    switch (movement.type) {
      case 'purchase':
      case 'return':
        stock += movement.quantity;
        break;
      case 'sale':
      case 'ship':
        stock -= movement.quantity;
        break;
      case 'adjustment':
        stock += movement.quantity;
        break;
    }
  }
  
  return stock;
};

// 靜態方法：獲取產品庫存異動歷史
InventorySchema.statics.getProductHistory = function(
  productId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { product: productId };
  
  if (startDate || endDate) {
    query.lastUpdated = {};
    if (startDate) query.lastUpdated.$gte = startDate;
    if (endDate) query.lastUpdated.$lte = endDate;
  }
  
  return this.find(query).sort({ lastUpdated: -1 });
};

// 複合索引
InventorySchema.index({ product: 1, lastUpdated: -1 });
InventorySchema.index({ type: 1, lastUpdated: -1 });
InventorySchema.index({ purchaseOrderId: 1 });
InventorySchema.index({ saleId: 1 });
InventorySchema.index({ shippingOrderId: 1 });

export default mongoose.model<IInventoryDocument>("inventory", InventorySchema);