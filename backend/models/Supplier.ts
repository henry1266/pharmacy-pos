import mongoose, { Schema, Model } from 'mongoose';
import { ISupplier, ISupplierDocument } from '../src/types/models';

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
const Supplier: Model<ISupplierDocument> = mongoose.model<ISupplierDocument>('supplier', SupplierSchema);

export default Supplier;
module.exports = Supplier;
module.exports.default = Supplier;
export type { ISupplier, ISupplierDocument };