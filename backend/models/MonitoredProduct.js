const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 用於儲存需要監控的產品編號的模型
const MonitoredProductSchema = new Schema({
  productCode: {
    type: String,
    required: [true, "產品編號為必填欄位"],
    unique: true, // 確保每個監控的產品編號是唯一的
    trim: true, // 去除前後空格
    index: true // 為 productCode 添加索引以優化查詢
  },
  // 可選：記錄添加者和添加時間
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: "User" // 假設存在 User 模型
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MonitoredProduct", MonitoredProductSchema);

