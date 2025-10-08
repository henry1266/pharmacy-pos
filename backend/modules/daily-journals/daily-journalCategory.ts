import mongoose, { Schema, Document } from 'mongoose';

// 記帳名目類別介面
export interface IAccountingCategory {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 記帳名目類別文檔介面
export interface IAccountingCategoryDocument extends IAccountingCategory, Document {
  _id: mongoose.Types.ObjectId;
}

// 記帳名目類別資料模型
const AccountingCategorySchema = new Schema<IAccountingCategoryDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 999 // 預設排序值，新增的類別會排在最後
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const AccountingCategory = mongoose.model<IAccountingCategoryDocument>('AccountingCategory', AccountingCategorySchema);

// 雙重導出策略以確保兼容性
export default AccountingCategory;

// CommonJS 兼容性
module.exports = AccountingCategory;
module.exports.default = AccountingCategory;