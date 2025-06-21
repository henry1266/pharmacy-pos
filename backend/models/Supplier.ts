import mongoose, { Schema } from 'mongoose';
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
SupplierSchema.methods.updateSupplierInfo = function(
  this: ISupplierDocument,
  data: Partial<ISupplier>
): void {
  Object.assign(this, data);
};

// 實例方法：獲取供應商摘要
SupplierSchema.methods.getSupplierSummary = function(
  this: ISupplierDocument
): {
  code: string;
  name: string;
  contactPerson?: string;
  totalOrders?: number;
} {
  const summary: {
    code: string;
    name: string;
    contactPerson?: string;
    totalOrders?: number;
  } = {
    code: this.code,
    name: this.name,
    totalOrders: 0 // 可以後續從 PurchaseOrder 計算
  };
  
  if (this.contactPerson) {
    summary.contactPerson = this.contactPerson;
  }
  
  return summary;
};

// 靜態方法：根據代碼查找供應商
SupplierSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code });
};

// 靜態方法：根據短代碼查找供應商
SupplierSchema.statics.findByShortCode = function(shortCode: string) {
  return this.findOne({ shortCode });
};

// 靜態方法：獲取活躍供應商列表
SupplierSchema.statics.getActiveSuppliers = function() {
  return this.find({}).sort({ name: 1 });
};

// 索引
SupplierSchema.index({ code: 1 });
SupplierSchema.index({ shortCode: 1 });
SupplierSchema.index({ name: 1 });

export default mongoose.model<ISupplierDocument>('supplier', SupplierSchema);