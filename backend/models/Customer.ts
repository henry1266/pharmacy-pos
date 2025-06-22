import { Schema, model } from 'mongoose';
import { ICustomer, ICustomerDocument } from '../src/types/models';

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
  note: {
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

export default model<ICustomerDocument>('customer', CustomerSchema);