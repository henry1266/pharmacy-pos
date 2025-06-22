import { Schema, model } from 'mongoose';
import { Customer as ICustomer } from '@shared/types/entities';
import mongoose from 'mongoose';

// 擴展 Mongoose Document 介面
interface ICustomerDocument extends Omit<ICustomer, '_id' | 'createdAt' | 'updatedAt'>, mongoose.Document {}

const CustomerSchema = new Schema<ICustomerDocument>({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  birthdate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  medicalHistory: {
    type: String
  },
  allergies: {
    type: [String],
    default: []
  },
  idCardNumber: {
    type: String,
    default: ""
  },
  membershipLevel: {
    type: String,
    enum: ["regular", "silver", "gold", "platinum"],
    default: "regular"
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  }
}, {
  timestamps: true
});

// 實例方法
CustomerSchema.methods.updatePurchaseRecord = function(amount: number): void {
  this.totalPurchases = (this.totalPurchases || 0) + amount;
  this.lastPurchaseDate = new Date();
};

CustomerSchema.methods.getAge = function(): number | null {
  if (!this.birthdate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

CustomerSchema.methods.isActiveCustomer = function(days: number = 90): boolean {
  if (!this.lastPurchaseDate) return false;
  const daysSinceLastPurchase = Math.floor((Date.now() - this.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceLastPurchase <= days;
};

CustomerSchema.methods.getCustomerTier = function(): string {
  const totalPurchases = this.totalPurchases || 0;
  
  if (totalPurchases >= 100000) return 'platinum';
  if (totalPurchases >= 50000) return 'gold';
  if (totalPurchases >= 20000) return 'silver';
  return 'regular';
};

const Customer = model<ICustomerDocument>('customer', CustomerSchema);

// 雙重導出策略以確保兼容性
export default Customer;
export type { ICustomer, ICustomerDocument };

// CommonJS 兼容性
module.exports = Customer;
module.exports.default = Customer;