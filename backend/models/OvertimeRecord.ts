import mongoose, { Schema, Document } from 'mongoose';

// 加班狀態枚舉
export type OvertimeStatus = 'pending' | 'approved' | 'rejected';

// 加班記錄介面
export interface IOvertimeRecord {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  description?: string;
  status: OvertimeStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalNote?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 加班記錄文檔介面
export interface IOvertimeRecordDocument extends IOvertimeRecord, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * 加班記錄模型
 * 用於記錄員工的額外加班時數，與排班系統中的加班標記分開管理
 */
const OvertimeRecordSchema = new Schema<IOvertimeRecordDocument>({
  // 關聯的員工
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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

const OvertimeRecord = mongoose.model<IOvertimeRecordDocument>("overtimeRecord", OvertimeRecordSchema);

// 雙重導出策略以確保兼容性
export default OvertimeRecord;

// CommonJS 兼容性
module.exports = OvertimeRecord;
module.exports.default = OvertimeRecord;