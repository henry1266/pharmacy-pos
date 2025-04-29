const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
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

module.exports = mongoose.model("inventory", InventorySchema);

