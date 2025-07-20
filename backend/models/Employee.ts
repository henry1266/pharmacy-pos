import mongoose, { Schema } from 'mongoose';
import { Employee as IEmployee } from '@pharmacy-pos/shared/types/entities';

// 擴展 Mongoose Document 介面
interface IEmployeeDocument extends Omit<IEmployee, '_id' | 'createdAt' | 'updatedAt'>, mongoose.Document {
  userId?: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployeeDocument>({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "男", "女", "其他"],
    required: false
  },
  birthDate: {
    type: Date,
    required: false
  },
  idNumber: {
    type: String,
    required: false,
    unique: false
  },
  address: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: false
  },
  hireDate: {
    type: Date,
    required: true
  },
  email: {
    type: String
  },
  salary: {
    type: Number
  },
  insuranceDate: {
    type: Date,
    required: false
  },
  education: {
    type: String,
    required: false
  },
  nativePlace: {
    type: String,
    required: false
  },
  experience: {
    type: String,
    required: false
  },
  rewards: {
    type: String,
    required: false
  },
  injuries: {
    type: String,
    required: false
  },
  additionalInfo: {
    type: String,
    required: false
  },
  idCardFront: {
    type: String,
    required: false
  },
  idCardBack: {
    type: String,
    required: false
  },
  signDate: {
    type: Date,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, {
  timestamps: true
});

const Employee = mongoose.model<IEmployeeDocument>("employee", EmployeeSchema);

// 雙重導出策略以確保兼容性
export default Employee;
export type { IEmployee, IEmployeeDocument };

// CommonJS 兼容性
module.exports = Employee;
module.exports.default = Employee;