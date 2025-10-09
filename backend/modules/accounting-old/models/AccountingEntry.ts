import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountingEntry extends Document {
  transactionGroupId: mongoose.Types.ObjectId | string; // 關聯交易群組
  sequence: number;           // 在群組中的順序
  
  // 借貸記帳核心欄位
  accountId: mongoose.Types.ObjectId | string;          // 會計科目ID
  debitAmount: number;        // 借方金額
  creditAmount: number;       // 貸方金額
  
  // 原有欄位保留相容性
  categoryId?: mongoose.Types.ObjectId | string;        // 類別ID (可選，用於報表分類)
  description: string;        // 分錄描述
  
  // 資金來源追蹤欄位
  sourceTransactionId?: mongoose.Types.ObjectId | string; // 此分錄的資金來源交易ID
  fundingPath?: string[];     // 資金流動路徑 (交易ID陣列的字串表示)
  
  // 機構與權限
  organizationId?: mongoose.Types.ObjectId | string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountingEntrySchema: Schema = new Schema({
  transactionGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroup',
    required: true
  },
  sequence: {
    type: Number,
    required: true,
    min: 1
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account2',
    required: true
  },
  debitAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  creditAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category2',
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // 資金來源追蹤欄位
  sourceTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroup',
    default: null
  },
  fundingPath: [{
    type: String,
    trim: true
  }],
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
  collection: 'accountingEntries'
});

// 索引
AccountingEntrySchema.index({ accountId: 1, createdAt: -1 });
AccountingEntrySchema.index({ createdBy: 1, createdAt: -1 });
AccountingEntrySchema.index({ organizationId: 1, createdAt: -1 });
AccountingEntrySchema.index({ organizationId: 1, createdBy: 1, createdAt: -1 });
AccountingEntrySchema.index({ categoryId: 1, createdAt: -1 });

// 資金來源追蹤索引
AccountingEntrySchema.index({ sourceTransactionId: 1 });
AccountingEntrySchema.index({ sourceTransactionId: 1, accountId: 1 });
AccountingEntrySchema.index({ fundingPath: 1 });

// 複合索引：確保同一交易群組內序號唯一（移除重複的一般索引）
AccountingEntrySchema.index({ transactionGroupId: 1, sequence: 1 }, { unique: true });

// 驗證：借方或貸方金額必須有一個大於0
AccountingEntrySchema.pre('save', function(this: IAccountingEntry, next) {
  if (this.debitAmount === 0 && this.creditAmount === 0) {
    return next(new Error('借方金額或貸方金額至少要有一個大於0'));
  }
  
  if (this.debitAmount > 0 && this.creditAmount > 0) {
    return next(new Error('借方金額和貸方金額不能同時大於0'));
  }
  
  next();
});

// 填充關聯資料 - 註解掉自動 populate，改由路由層控制
// AccountingEntrySchema.pre(/^find/, function(this: any, next: any) {
//   this.populate('transactionGroupId', 'groupNumber description transactionDate status')
//       .populate('accountId', 'name code accountType normalBalance')
//       .populate('categoryId', 'name type color icon');
//   next();
// });

export default mongoose.model<IAccountingEntry>('AccountingEntry', AccountingEntrySchema);