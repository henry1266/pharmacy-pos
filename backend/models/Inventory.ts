import mongoose, { Schema, Document } from 'mongoose';

// 庫存類型枚舉
export type InventoryType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship' | 'sale-no-stock';

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
  batchNumber?: string; // 批號欄位
  createdBy?: mongoose.Types.ObjectId; // 創建者ID
  // 新增「不扣庫存」毛利計算相關欄位
  costPrice?: number; // 進價（成本價）
  unitPrice?: number; // 售價（單價）
  grossProfit?: number; // 毛利
  // 新增大包裝相關欄位
  packageQuantity?: number; // 大包裝數量
  boxQuantity?: number; // 盒裝數量
  unit?: string; // 單位
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
    enum: ["purchase", "sale", "return", "adjustment", "ship", "sale-no-stock"],
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
  batchNumber: { // 批號欄位
    type: String
  },
  createdBy: { // 創建者ID
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // 新增「不扣庫存」毛利計算相關欄位
  costPrice: { // 進價（成本價）
    type: Number,
    default: 0
  },
  unitPrice: { // 售價（單價）
    type: Number,
    default: 0
  },
  grossProfit: { // 毛利
    type: Number,
    default: 0
  },
  // 新增大包裝相關欄位
  packageQuantity: { // 大包裝數量
    type: Number
  },
  boxQuantity: { // 盒裝數量
    type: Number
  },
  unit: { // 單位
    type: String
  }
}, {
  timestamps: true // 自動添加 createdAt 和 updatedAt
});

const Inventory = mongoose.model<IInventoryDocument>("inventory", InventorySchema);
export default Inventory;
module.exports = Inventory;
module.exports.default = Inventory;