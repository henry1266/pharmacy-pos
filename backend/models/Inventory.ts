import mongoose, { Schema, Document } from 'mongoose';

// 庫存類型枚舉
export type InventoryType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship';

// 庫存介面
export interface IInventory {
  product: mongoose.Types.ObjectId;
  quantity: number;
  totalAmount: number;
  purchaseOrderId?: mongoose.Types.ObjectId;
  purchaseOrderNumber?: string;
  type: InventoryType;
  referenceId?: mongoose.Types.ObjectId; // 參考ID（如銷售ID、採購ID等）
  saleId?: mongoose.Types.ObjectId;
  saleNumber?: string;
  shippingOrderId?: mongoose.Types.ObjectId;
  shippingOrderNumber?: string;
  accountingId?: mongoose.Types.ObjectId; // 新增欄位，用於連結到記帳記錄
  date: Date;
  lastUpdated: Date;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId; // 創建者ID
}

// 庫存文檔介面
export interface IInventoryDocument extends IInventory, Document {
  _id: mongoose.Types.ObjectId;
}

const InventorySchema = new Schema<IInventoryDocument>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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
  referenceId: { // 參考ID（如銷售ID、採購ID等）
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sale"
  },
  saleNumber: {
    type: String
  },
  shippingOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shippingorder"
  },
  shippingOrderNumber: {
    type: String
  },
  accountingId: { // 新增欄位，用於連結到記帳記錄
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accounting",
    index: true, // 為 accountingId 添加索引
    default: null // 預設為 null，表示未連結
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true // 為 lastUpdated 添加索引
  },
  notes: {
    type: String
  },
  createdBy: { // 創建者ID
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true // 自動添加 createdAt 和 updatedAt
});

const Inventory = mongoose.model<IInventoryDocument>("inventory", InventorySchema);
export default Inventory;
module.exports = Inventory;
module.exports.default = Inventory;