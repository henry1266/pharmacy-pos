import mongoose, { Schema, Document } from 'mongoose';

// 員工介面
export interface IEmployee {
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  idNumber: string;
  education?: string;
  nativePlace?: string;
  address: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  insuranceDate?: Date;
  experience?: string;
  rewards?: string;
  injuries?: string;
  additionalInfo?: string;
  idCardFront?: string; // 存儲圖片路徑或URL
  idCardBack?: string; // 存儲圖片路徑或URL
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 員工文檔介面
export interface IEmployeeDocument extends IEmployee, Document {
  _id: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployeeDocument>({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  education: {
    type: String
  },
  nativePlace: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number
  },
  insuranceDate: {
    type: Date
  },
  experience: {
    type: String
  },
  rewards: {
    type: String
  },
  injuries: {
    type: String
  },
  additionalInfo: {
    type: String
  },
  idCardFront: {
    type: String // 存儲圖片路徑或URL
  },
  idCardBack: {
    type: String // 存儲圖片路徑或URL
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IEmployeeDocument>("employee", EmployeeSchema);