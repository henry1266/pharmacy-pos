import mongoose, { Schema, Model } from 'mongoose';

// 定義 EmployeeSchedule 介面
export interface IEmployeeSchedule {
  date: Date;
  shift: 'morning' | 'afternoon' | 'evening';
  employeeId: mongoose.Types.ObjectId;
  leaveType: null | 'sick' | 'personal' | 'overtime';
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// 擴展 Document 介面
export interface IEmployeeScheduleDocument extends IEmployeeSchedule, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

// 定義靜態方法介面
interface IEmployeeScheduleModel extends Model<IEmployeeScheduleDocument> {
  // 可以添加靜態方法
}

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
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: [null, "sick", "personal", "overtime"],
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, { timestamps: true });

// Create a compound index to ensure an employee can only be scheduled once per shift per day
EmployeeScheduleSchema.index({ date: 1, shift: 1, employeeId: 1 }, { unique: true });

export default mongoose.model<IEmployeeScheduleDocument, IEmployeeScheduleModel>('employeeSchedule', EmployeeScheduleSchema);