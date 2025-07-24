import mongoose, { Schema, Model } from 'mongoose';
import { Supplier as ISupplier } from '@pharmacy-pos/shared/types/entities';

// 擴展 Mongoose Document 介面
interface ISupplierDocument extends Omit<ISupplier, '_id'>, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>({
  code: {
    type: String,
    required: true,
    unique: true
  },
  shortCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  taxId: {
    type: String
  },
  paymentTerms: {
    type: String
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 實例方法：更新供應商資訊
SupplierSchema.methods.updateSupplierInfo = function(data: Partial<ISupplier>): void {
  Object.assign(this, data);
};

// 實例方法：取得供應商摘要
SupplierSchema.methods.getSupplierSummary = function(): {
  code: string;
  name: string;
  contactPerson?: string;
  totalOrders?: number;
} {
  return {
    code: this.code,
    name: this.name,
    contactPerson: this.contactPerson,
    // totalOrders 需要透過其他查詢計算，這裡先設為 undefined
    totalOrders: undefined
  };
};

// 建立並匯出模型
const Supplier: Model<ISupplierDocument> = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);

// 雙重導出策略以確保兼容性
export default Supplier;
export type { ISupplier, ISupplierDocument };

// CommonJS 兼容性
module.exports = Supplier;
module.exports.default = Supplier;