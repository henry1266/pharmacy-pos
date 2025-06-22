import mongoose, { Schema, Document } from 'mongoose';

// 監控產品介面
export interface IMonitoredProduct {
  productCode: string;
  addedBy?: mongoose.Types.ObjectId;
  addedAt: Date;
}

// 監控產品文檔介面
export interface IMonitoredProductDocument extends IMonitoredProduct, Document {
  _id: mongoose.Types.ObjectId;
}

// 用於儲存需要監控的產品編號的模型
const MonitoredProductSchema = new Schema<IMonitoredProductDocument>({
  productCode: {
    type: String,
    required: [true, "產品編號為必填欄位"],
    unique: true, // 確保每個監控的產品編號是唯一的
    trim: true, // 去除前後空格
    index: true // 為 productCode 添加索引以優化查詢
  },
  // 可選：記錄添加者和添加時間
  addedBy: {
    // 恢復為 ObjectId 並保留 ref
    type: Schema.Types.ObjectId,
    ref: "User" 
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMonitoredProductDocument>("MonitoredProduct", MonitoredProductSchema);