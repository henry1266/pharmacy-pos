import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount2 extends Document {
  code: string;               // 會計科目代碼 (如: 1101, 2201)
  name: string;               // 科目名稱
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other'; // 保留原有類型相容性
  parentId?: mongoose.Types.ObjectId | null;          // 父科目ID
  level: number;              // 科目層級
  isActive: boolean;
  normalBalance: 'debit' | 'credit'; // 正常餘額方向
  
  // 原有欄位
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: mongoose.Types.ObjectId | null; // 機構 ID（可選，支援個人帳戶）
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const Account2Schema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  accountType: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'bank', 'credit', 'investment', 'other'],
    default: 'other'
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Account2',
    default: null
  },
  level: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 5
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  normalBalance: {
    type: String,
    required: true,
    enum: ['debit', 'credit']
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  initialBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'TWD',
    maxlength: 3
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'accounts2'
});

// 索引
// 機構隔離的代碼唯一性：同一機構內代碼唯一，不同機構可重複
Account2Schema.index(
  { organizationId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { organizationId: { $ne: null } }
  }
);
// 個人帳戶（無機構）的代碼唯一性
Account2Schema.index(
  { createdBy: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { organizationId: null }
  }
);
Account2Schema.index({ createdBy: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, createdBy: 1, isActive: 1 });
Account2Schema.index({ accountType: 1, isActive: 1 });
Account2Schema.index({ type: 1, isActive: 1 });
Account2Schema.index({ parentId: 1, level: 1 });
Account2Schema.index({ level: 1, code: 1 });

// 虛擬欄位：子科目
Account2Schema.virtual('children', {
  ref: 'Account2',
  localField: '_id',
  foreignField: 'parentId'
});

// 確保 JSON 輸出包含虛擬欄位
Account2Schema.set('toJSON', { virtuals: true });
Account2Schema.set('toObject', { virtuals: true });

// 根據會計科目類型自動設定正常餘額方向
Account2Schema.pre('save', function(this: IAccount2, next) {
  if (this.isNew || this.isModified('accountType')) {
    switch (this.accountType) {
      case 'asset':
      case 'expense':
        this.normalBalance = 'debit';
        break;
      case 'liability':
      case 'equity':
      case 'revenue':
        this.normalBalance = 'credit';
        break;
    }
  }
  
  // 根據父科目設定層級
  if (this.parentId && (this.isNew || this.isModified('parentId'))) {
    mongoose.model('Account2').findById(this.parentId)
      .then(parent => {
        if (parent) {
          this.level = (parent as IAccount2).level + 1;
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

export default mongoose.model<IAccount2>('Account2', Account2Schema);