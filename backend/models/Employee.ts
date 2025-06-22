import mongoose, { Schema, Document } from 'mongoose';
import { Employee as IEmployee } from '@shared/types/entities';

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