import mongoose, { Schema, Document, Model } from "mongoose";

// 定義加班記錄介面
export interface IOvertimeRecord {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  approvalNote?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// 擴展 Document 介面
export interface IOvertimeRecordDocument extends IOvertimeRecord, Document {
  _id: mongoose.Types.ObjectId;
}

// 定義靜態方法介面
interface IOvertimeRecordModel extends Model<IOvertimeRecordDocument> {
  // 可以添加靜態方法
}

/**
 * 加班記錄模型
 * 用於記錄員工的額外加班時數，與排班系統中的加班標記分開管理
 */
const OvertimeRecordSchema = new Schema({
  // 關聯的員工
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  // 加班日期
  date: {
    type: Date,
    required: true
  },
  // 加班時數 (小時)
  hours: {
    type: Number,
    required: true,
    min: 0.5,
    max: 24
  },
  // 加班原因/說明
  description: {
    type: String,
    required: false,
    maxlength: 500
  },
  // 加班狀態 (待審核、已核准、已拒絕)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // 審核人員
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    default: null
  },
  // 審核日期
  approvedAt: {
    type: Date,
    default: null
  },
  // 審核備註
  approvalNote: {
    type: String,
    maxlength: 500
  },
  // 創建人員
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  // 創建時間
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新時間
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時自動更新 updatedAt 欄位
OvertimeRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 創建複合索引，確保查詢效率
OvertimeRecordSchema.index({ employeeId: 1, date: 1 });
OvertimeRecordSchema.index({ status: 1 });
OvertimeRecordSchema.index({ createdAt: -1 });

export default mongoose.model<IOvertimeRecordDocument, IOvertimeRecordModel>("overtimeRecord", OvertimeRecordSchema);