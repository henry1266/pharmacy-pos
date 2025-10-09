import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountingRecord2 extends Document {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryId: string;
  accountId: string;
  date: Date;
  description?: string;
  tags?: string[];
  attachments?: string[];
  organizationId?: string; // 機構 ID（可選，支援個人記錄）
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const AccountingRecord2Schema: Schema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category2',
    required: true
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account2',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  attachments: [{
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
  collection: 'accountingRecords2'
});

// 索引
AccountingRecord2Schema.index({ createdBy: 1, date: -1 });
AccountingRecord2Schema.index({ organizationId: 1, date: -1 });
AccountingRecord2Schema.index({ organizationId: 1, createdBy: 1, date: -1 });
AccountingRecord2Schema.index({ categoryId: 1, date: -1 });
AccountingRecord2Schema.index({ accountId: 1, date: -1 });
AccountingRecord2Schema.index({ type: 1, date: -1 });
AccountingRecord2Schema.index({ tags: 1 });

// 填充關聯資料
AccountingRecord2Schema.pre(/^find/, function(this: any, next: any) {
  this.populate('categoryId', 'name type color icon')
      .populate('accountId', 'name type');
  next();
});

export default mongoose.model<IAccountingRecord2>('AccountingRecord2', AccountingRecord2Schema);