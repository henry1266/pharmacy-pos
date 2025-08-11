import mongoose, { Schema, Model } from 'mongoose';
import { IEmployeeScheduleDocument } from '../src/types/models';

/**
 * @description 員工排班模型模式定義
 * @type {Schema}
 */
const EmployeeScheduleSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ["morning", "afternoon", "evening"],
    required: true
  },
  startTime: {
    type: String,
    required: false,
    default: '08:30'
  },
  endTime: {
    type: String,
    required: false,
    default: '18:00'
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: [null, "sick", "personal", "overtime"],
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
}, {
  timestamps: true
});

/**
 * @description 創建複合索引，確保每位員工在每天的每個班次只能被排班一次
 */
EmployeeScheduleSchema.index({ date: 1, shift: 1, employeeId: 1 }, { unique: true });

/**
 * @description 員工排班模型
 * @type {Model<IEmployeeScheduleDocument>}
 */
const EmployeeSchedule: Model<IEmployeeScheduleDocument> = mongoose.model<IEmployeeScheduleDocument>("employeeSchedule", EmployeeScheduleSchema);

/**
 * @description 導出員工排班模型
 */
export default EmployeeSchedule;

/**
 * @description CommonJS 兼容性導出
 */
module.exports = EmployeeSchedule;
module.exports.default = EmployeeSchedule;

/**
 * @description 導出員工排班文檔接口類型
 */
export type { IEmployeeScheduleDocument };