import mongoose, { Schema, Document } from 'mongoose';

// 帳戶類型介面
export interface IAccountType {
  code: string;                    // 類型代碼 (如: asset, liability)
  name: string;                    // 類型名稱 (如: 資產, 負債)
  label: string;                   // 顯示標籤
  description?: string;            // 描述
  codePrefix: string;              // 科目代號前綴 (如: 1, 2, 3)
  normalBalance: 'debit' | 'credit'; // 正常餘額方向
  isSystem: boolean;               // 是否為系統預設類型
  isActive: boolean;               // 是否啟用
  sortOrder: number;               // 排序順序
  organizationId?: mongoose.Types.ObjectId | string; // 機構ID (可選，支援個人設定)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 帳戶類型文檔介面
export interface IAccountTypeDocument extends IAccountType, Document {
  _id: mongoose.Types.ObjectId;
  canDelete(): boolean;
  canEdit(): boolean;
}

// 帳戶類型模型介面
export interface IAccountTypeModel extends mongoose.Model<IAccountTypeDocument> {
  getSystemTypes(): Promise<IAccountTypeDocument[]>;
  getByOrganization(organizationId?: string): Promise<IAccountTypeDocument[]>;
  isCodeAvailable(code: string, organizationId?: string, excludeId?: string): Promise<boolean>;
}

// 帳戶類型資料模型
const AccountTypeSchema = new Schema<IAccountTypeDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  codePrefix: {
    type: String,
    required: true,
    trim: true
  },
  normalBalance: {
    type: String,
    required: true,
    enum: ['debit', 'credit']
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 999
  },
  organizationId: {
    type: String,
    ref: 'Organization',
    index: true
  },
  createdBy: {
    type: Schema.Types.Mixed,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'accountTypes'
});

// 複合索引
AccountTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });
AccountTypeSchema.index({ organizationId: 1, sortOrder: 1 });
AccountTypeSchema.index({ isActive: 1, sortOrder: 1 });

// 靜態方法：取得系統預設類型
AccountTypeSchema.statics.getSystemTypes = function() {
  return this.find({ isSystem: true, isActive: true }).sort({ sortOrder: 1 });
};

// 靜態方法：取得機構的帳戶類型
AccountTypeSchema.statics.getByOrganization = function(organizationId: string) {
  const query = organizationId ? 
    { $or: [{ organizationId }, { isSystem: true }] } : 
    { isSystem: true };
  
  return this.find({ ...query, isActive: true }).sort({ sortOrder: 1 });
};

// 靜態方法：檢查代碼是否可用
AccountTypeSchema.statics.isCodeAvailable = function(code: string, organizationId?: string, excludeId?: string) {
  const query: any = { code };
  
  if (organizationId) {
    query.$or = [{ organizationId }, { isSystem: true }];
  } else {
    query.isSystem = true;
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query).then((doc: any) => !doc);
};

// 實例方法：檢查是否可以刪除
AccountTypeSchema.methods.canDelete = function(this: IAccountTypeDocument): boolean {
  return !this.isSystem;
};

// 實例方法：檢查是否可以編輯
AccountTypeSchema.methods.canEdit = function(this: IAccountTypeDocument): boolean {
  return !this.isSystem;
};

const AccountType = mongoose.model<IAccountTypeDocument, IAccountTypeModel>('AccountType', AccountTypeSchema);

// 初始化系統預設類型
export const initializeSystemAccountTypes = async () => {
  const systemTypes = [
    {
      code: 'asset',
      name: '資產',
      label: '資產',
      description: '企業擁有的經濟資源',
      codePrefix: '1',
      normalBalance: 'debit',
      isSystem: true,
      sortOrder: 1
    },
    {
      code: 'liability',
      name: '負債',
      label: '負債',
      description: '企業對外的債務',
      codePrefix: '2',
      normalBalance: 'credit',
      isSystem: true,
      sortOrder: 2
    },
    {
      code: 'equity',
      name: '權益',
      label: '權益',
      description: '股東權益',
      codePrefix: '3',
      normalBalance: 'credit',
      isSystem: true,
      sortOrder: 3
    },
    {
      code: 'revenue',
      name: '收入',
      label: '收入',
      description: '營業收入',
      codePrefix: '4',
      normalBalance: 'credit',
      isSystem: true,
      sortOrder: 4
    },
    {
      code: 'expense',
      name: '費用',
      label: '費用',
      description: '營業費用',
      codePrefix: '5',
      normalBalance: 'debit',
      isSystem: true,
      sortOrder: 5
    }
  ];

  for (const typeData of systemTypes) {
    const exists = await AccountType.findOne({ code: typeData.code, isSystem: true });
    if (!exists) {
      await AccountType.create({
        ...typeData,
        createdBy: 'system'
      });
    }
  }
};

export default AccountType;

// CommonJS 兼容性
module.exports = AccountType;
module.exports.default = AccountType;
module.exports.initializeSystemAccountTypes = initializeSystemAccountTypes;