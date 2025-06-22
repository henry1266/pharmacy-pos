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
  saleId?: mongoose.Types.ObjectId;
  saleNumber?: string;
  shippingOrderId?: mongoose.Types.ObjectId;
  shippingOrderNumber?: string;
  accountingId?: mongoose.Types.ObjectId; // 新增欄位，用於連結到記帳記錄
  lastUpdated: Date;
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
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true // 為 lastUpdated 添加索引
  }
});

const Inventory = mongoose.model<IInventoryDocument>("inventory", InventorySchema);
export default Inventory;
module.exports = Inventory;
module.exports.default = Inventory;