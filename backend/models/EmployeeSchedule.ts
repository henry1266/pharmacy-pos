import mongoose, { Schema, Model } from 'mongoose';
import { IEmployeeScheduleDocument } from '../src/types/models';

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

// Create a compound index to ensure an employee can only be scheduled once per shift per day
EmployeeScheduleSchema.index({ date: 1, shift: 1, employeeId: 1 }, { unique: true });

const EmployeeSchedule: Model<IEmployeeScheduleDocument> = mongoose.model<IEmployeeScheduleDocument>("employeeSchedule", EmployeeScheduleSchema);

export default EmployeeSchedule;
export type { IEmployeeScheduleDocument };