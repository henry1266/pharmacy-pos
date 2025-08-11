import mongoose, { Schema } from 'mongoose';
import { Employee as IEmployee } from '@pharmacy-pos/shared/types/entities';

/**
 * @description 員工文檔接口，擴展自共享類型
 * @interface IEmployeeDocument
 * @extends {Omit<IEmployee, '_id' | 'createdAt' | 'updatedAt'>}
 * @extends {mongoose.Document}
 */
interface IEmployeeDocument extends Omit<IEmployee, '_id' | 'createdAt' | 'updatedAt'>, mongoose.Document {
  userId?: mongoose.Types.ObjectId;
}

/**
 * @description 員工模型模式定義
 * @type {Schema<IEmployeeDocument>}
 */
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

/**
 * @description 員工模型
 * @type {mongoose.Model<IEmployeeDocument>}
 */
const Employee = mongoose.model<IEmployeeDocument>("employee", EmployeeSchema);

/**
 * @description 雙重導出策略以確保兼容性
 */
export default Employee;
export type { IEmployee, IEmployeeDocument };

/**
 * @description CommonJS 兼容性導出
 */
module.exports = Employee;
module.exports.default = Employee;