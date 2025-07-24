import mongoose, { Schema, Document } from 'mongoose';

/**
 * 供應商與會計科目配對介面
 */
export interface ISupplierAccountMapping extends Document {
  _id: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;        // 供應商ID
  supplierName: string;                       // 供應商名稱（冗餘欄位，便於查詢）
  organizationId: mongoose.Types.ObjectId;    // 機構ID
  accountMappings: {
    accountId: mongoose.Types.ObjectId;       // 會計科目ID
    accountCode: string;                      // 會計科目代碼（冗餘欄位）
    accountName: string;                      // 會計科目名稱（冗餘欄位）
    isDefault: boolean;                       // 是否為預設科目
    priority: number;                         // 優先順序（數字越小優先級越高）
  }[];
  isActive: boolean;                          // 是否啟用
  notes?: string;                             // 備註
  createdBy: string;                          // 創建者
  updatedBy: string;                          // 更新者
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 供應商會計科目配對 Schema
 */
const SupplierAccountMappingSchema = new Schema<ISupplierAccountMapping>({
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  accountMappings: [{
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account2',
      required: true
    },
    accountCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'supplier_account_mappings'
});

// 索引設定
// 確保同一機構內的供應商配對唯一性
SupplierAccountMappingSchema.index({ 
  organizationId: 1, 
  supplierId: 1 
}, { 
  unique: true 
});

// 查詢優化索引
SupplierAccountMappingSchema.index({ organizationId: 1, isActive: 1 });
SupplierAccountMappingSchema.index({ supplierId: 1, isActive: 1 });
SupplierAccountMappingSchema.index({ 'accountMappings.accountId': 1 });

// 中間件：更新供應商名稱
SupplierAccountMappingSchema.pre('save', async function(this: ISupplierAccountMapping, next) {
  if (this.isNew || this.isModified('supplierId')) {
    try {
      const Supplier = mongoose.model('supplier');
      const supplier = await Supplier.findById(this.supplierId);
      if (supplier) {
        this.supplierName = supplier.name;
      }
    } catch (error) {
      console.error('更新供應商名稱時發生錯誤:', error);
    }
  }
  
  // 確保只有一個預設科目
  const defaults = this.accountMappings.filter(m => m.isDefault);
  
  if (defaults.length > 1) {
    // 保留優先級最高的，其他設為非預設
    defaults.sort((a, b) => a.priority - b.priority);
    for (let i = 1; i < defaults.length; i++) {
      defaults[i].isDefault = false;
    }
  }
  
  next();
});

// 靜態方法：根據供應商查找配對
SupplierAccountMappingSchema.statics.findMappingsBySupplier = function(
  supplierId: string,
  organizationId: string
) {
  const query: any = {
    supplierId: new mongoose.Types.ObjectId(supplierId),
    organizationId: new mongoose.Types.ObjectId(organizationId),
    isActive: true
  };
  
  return this.findOne(query).populate('supplierId', 'name code').populate('accountMappings.accountId', 'code name accountType');
};

// 靜態方法：獲取預設科目
SupplierAccountMappingSchema.statics.getDefaultAccount = function(
  supplierId: string,
  organizationId: string
) {
  return this.findOne({
    supplierId: new mongoose.Types.ObjectId(supplierId),
    organizationId: new mongoose.Types.ObjectId(organizationId),
    isActive: true,
    'accountMappings.isDefault': true
  }, {
    'accountMappings.$': 1
  });
};

export default mongoose.model<ISupplierAccountMapping>('SupplierAccountMapping', SupplierAccountMappingSchema);