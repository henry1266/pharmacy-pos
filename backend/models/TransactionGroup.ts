import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionGroup extends Document {
  groupNumber: string;        // 交易群組編號 (如: TXN-20250102-001)
  description: string;        // 交易描述
  transactionDate: Date;      // 交易日期
  organizationId?: mongoose.Types.ObjectId | string;    // 機構ID
  receiptUrl?: string;        // 憑證URL
  invoiceNo?: string;         // 發票號碼
  totalAmount: number;        // 交易總金額
  status: 'draft' | 'confirmed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionGroupSchema: Schema = new Schema({
  groupNumber: {
    type: String,
    required: false,  // 改為可選，因為在路由中手動設定
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  receiptUrl: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  invoiceNo: {
    type: String,
    trim: true,
    maxlength: 50
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'confirmed', 'cancelled'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'transactionGroups'
});

// 索引
TransactionGroupSchema.index({ createdBy: 1, transactionDate: -1 });
TransactionGroupSchema.index({ organizationId: 1, transactionDate: -1 });
TransactionGroupSchema.index({ organizationId: 1, createdBy: 1, transactionDate: -1 });
TransactionGroupSchema.index({ groupNumber: 1 }, { unique: true });
TransactionGroupSchema.index({ status: 1, transactionDate: -1 });
TransactionGroupSchema.index({ invoiceNo: 1 });

// 自動生成交易群組編號
TransactionGroupSchema.pre('save', async function(this: ITransactionGroup, next) {
  if (this.isNew && !this.groupNumber) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // 使用 this.constructor 避免循環引用問題
      const TransactionGroupModel = this.constructor as mongoose.Model<ITransactionGroup>;
      
      // 查找今日最大序號
      const lastGroup = await TransactionGroupModel.findOne({
        groupNumber: new RegExp(`^TXN-${dateStr}-`)
      }).sort({ groupNumber: -1 }).session(this.$session());
      
      let sequence = 1;
      if (lastGroup) {
        const parts = lastGroup.groupNumber.split('-');
        if (parts.length === 3) {
          const lastSequence = parseInt(parts[2]);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }
      
      this.groupNumber = `TXN-${dateStr}-${sequence.toString().padStart(3, '0')}`;
      console.log('✅ 自動生成 groupNumber:', this.groupNumber);
    } catch (error) {
      console.error('❌ 生成 groupNumber 錯誤:', error);
      return next(error instanceof Error ? error : new Error('生成交易群組編號失敗'));
    }
  }
  next();
});

export default mongoose.model<ITransactionGroup>('TransactionGroup', TransactionGroupSchema);