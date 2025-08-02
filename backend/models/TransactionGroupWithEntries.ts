import mongoose, { Schema, Document } from 'mongoose';

// 內嵌分錄子文檔介面
export interface IEmbeddedAccountingEntry {
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
}

// 資金來源使用明細介面
export interface IFundingSourceUsage {
  sourceTransactionId: mongoose.Types.ObjectId | string;  // 資金來源交易ID
  usedAmount: number;                                      // 實際使用金額
  description?: string;                                    // 使用說明
}

// 付款資訊介面
export interface IPaymentInfo {
  paymentMethod: string;      // 付款方式
  payableTransactions: Array<{
    transactionId: mongoose.Types.ObjectId | string;
    paidAmount: number;
    remainingAmount?: number;
  }>;
}

// 應付帳款資訊介面
export interface IPayableInfo {
  supplierId?: mongoose.Types.ObjectId | string;
  supplierName?: string;
  dueDate?: Date;
  totalPaidAmount: number;
  isPaidOff: boolean;
  paymentHistory: Array<{
    paymentTransactionId: mongoose.Types.ObjectId | string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
}

// 更新後的交易群組介面
export interface ITransactionGroupWithEntries extends Document {
  groupNumber: string;        // 交易群組編號 (如: TXN-20250102-001)
  description: string;        // 交易描述
  transactionDate: Date;      // 交易日期
  organizationId?: mongoose.Types.ObjectId | string;    // 機構ID
  receiptUrl?: string;        // 憑證URL
  invoiceNo?: string;         // 發票號碼
  totalAmount: number;        // 交易總金額
  status: 'draft' | 'confirmed' | 'cancelled';
  
  // 🆕 交易類型
  transactionType: 'purchase' | 'payment' | 'general';
  
  // 資金來源追蹤功能
  linkedTransactionIds: (mongoose.Types.ObjectId | string)[]; // 被延伸使用的交易ID陣列（保留向後相容）
  sourceTransactionId?: mongoose.Types.ObjectId | string;     // 此交易的資金來源交易ID
  fundingType: 'original' | 'extended' | 'transfer';          // 資金類型：原始/延伸/轉帳
  
  // 🆕 精確資金來源使用追蹤
  fundingSourceUsages?: IFundingSourceUsage[];                // 資金來源使用明細
  
  // 🆕 付款相關資訊
  paymentInfo?: IPaymentInfo;                                  // 付款交易資訊
  
  // 🆕 應付帳款相關資訊
  payableInfo?: IPayableInfo;                                  // 應付帳款資訊
  
  // 內嵌分錄陣列 - 新增的核心欄位
  entries: IEmbeddedAccountingEntry[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 付款歷史子文檔 Schema
const PaymentHistorySchema: Schema = new Schema({
  paymentTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroupWithEntries',
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: 50
  }
}, {
  _id: false,
  timestamps: false
});

// 應付帳款資訊子文檔 Schema
const PayableInfoSchema: Schema = new Schema({
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  supplierName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  dueDate: {
    type: Date,
    default: null
  },
  totalPaidAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isPaidOff: {
    type: Boolean,
    required: true,
    default: false
  },
  paymentHistory: [PaymentHistorySchema]
}, {
  _id: false,
  timestamps: false
});

// 付款交易子文檔 Schema
const PayableTransactionSchema: Schema = new Schema({
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroupWithEntries',
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  _id: false,
  timestamps: false
});

// 付款資訊子文檔 Schema
const PaymentInfoSchema: Schema = new Schema({
  paymentMethod: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  payableTransactions: [PayableTransactionSchema]
}, {
  _id: false,
  timestamps: false
});

// 資金來源使用明細子文檔 Schema
const FundingSourceUsageSchema: Schema = new Schema({
  sourceTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroupWithEntries',
    required: true
  },
  usedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  _id: false, // 不需要獨立的 _id
  timestamps: false
});

// 內嵌分錄子文檔 Schema
const EmbeddedAccountingEntrySchema: Schema = new Schema({
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
    ref: 'TransactionGroupWithEntries',
    default: null
  },
  fundingPath: [{
    type: String,
    trim: true
  }]
}, {
  _id: true, // 每個分錄子文檔都有自己的 _id
  timestamps: false // 子文檔不需要獨立的時間戳
});

// 更新後的交易群組 Schema
const TransactionGroupWithEntriesSchema: Schema = new Schema({
  groupNumber: {
    type: String,
    required: false,  // 改為可選，因為在路由中手動設定
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
  
  // 🆕 交易類型
  transactionType: {
    type: String,
    required: true,
    enum: ['purchase', 'payment', 'general'],
    default: 'general'
  },
  
  // 資金來源追蹤欄位
  linkedTransactionIds: [{
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroupWithEntries'
  }],
  sourceTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionGroupWithEntries',
    default: null
  },
  fundingType: {
    type: String,
    required: true,
    enum: ['original', 'extended', 'transfer'],
    default: 'original'
  },
  
  // 🆕 精確資金來源使用追蹤
  fundingSourceUsages: [FundingSourceUsageSchema],
  
  // 🆕 付款相關資訊
  paymentInfo: {
    type: PaymentInfoSchema,
    default: null
  },
  
  // 🆕 應付帳款相關資訊
  payableInfo: {
    type: PayableInfoSchema,
    default: null
  },
  
  // 內嵌分錄陣列 - 核心新增欄位
  entries: {
    type: [EmbeddedAccountingEntrySchema],
    required: true,
    default: [],
    validate: {
      validator: function(entries: IEmbeddedAccountingEntry[]) {
        // 驗證至少要有兩筆分錄
        return entries.length >= 2;
      },
      message: '複式記帳需要至少兩筆分錄'
    }
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'transactionGroups' // 使用相同的 collection 名稱
});

// 索引配置
TransactionGroupWithEntriesSchema.index({ createdBy: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ organizationId: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ organizationId: 1, createdBy: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ groupNumber: 1 }, { unique: true });
TransactionGroupWithEntriesSchema.index({ status: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ invoiceNo: 1 });

// 資金來源追蹤索引
TransactionGroupWithEntriesSchema.index({ linkedTransactionIds: 1 });
TransactionGroupWithEntriesSchema.index({ sourceTransactionId: 1 });
TransactionGroupWithEntriesSchema.index({ fundingType: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ sourceTransactionId: 1, fundingType: 1 });

// 🆕 交易類型和付款相關索引
TransactionGroupWithEntriesSchema.index({ transactionType: 1, status: 1 });
TransactionGroupWithEntriesSchema.index({ transactionType: 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ 'payableInfo.isPaidOff': 1, transactionType: 1 });
TransactionGroupWithEntriesSchema.index({ 'payableInfo.supplierId': 1, transactionType: 1 });
TransactionGroupWithEntriesSchema.index({ 'payableInfo.dueDate': 1, 'payableInfo.isPaidOff': 1 });
TransactionGroupWithEntriesSchema.index({ 'paymentInfo.paymentMethod': 1, transactionType: 1 });

// 內嵌分錄相關索引
TransactionGroupWithEntriesSchema.index({ 'entries.accountId': 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ 'entries.categoryId': 1, transactionDate: -1 });
TransactionGroupWithEntriesSchema.index({ 'entries.sourceTransactionId': 1 });
TransactionGroupWithEntriesSchema.index({ createdBy: 1, 'entries.accountId': 1, transactionDate: -1 });

// 自動生成交易群組編號
TransactionGroupWithEntriesSchema.pre('save', async function(this: ITransactionGroupWithEntries, next) {
  if (this.isNew && !this.groupNumber) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // 使用 this.constructor 避免循環引用問題
      const TransactionGroupModel = this.constructor as mongoose.Model<ITransactionGroupWithEntries>;
      
      // 查找今日最大序號
      const lastGroup = await TransactionGroupModel.findOne({
        groupNumber: new RegExp(`^TXN-${dateStr}-`)
      }).sort({ groupNumber: -1 }).session(this.$session());
      
      let sequence = 1;
      if (lastGroup) {
        const parts = lastGroup.groupNumber.split('-');
        if (parts.length === 3 && parts[2]) {
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

// 借貸平衡驗證
TransactionGroupWithEntriesSchema.pre('save', function(this: ITransactionGroupWithEntries, next) {
  if (this.entries && this.entries.length > 0) {
    // 計算借貸總額
    const totalDebit = this.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = this.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    
    // 檢查借貸平衡（允許 0.01 的誤差）
    if (difference >= 0.01) {
      return next(new Error(`借貸不平衡：借方總額 ${totalDebit}，貸方總額 ${totalCredit}，差額 ${difference}`));
    }
    
    // 驗證每筆分錄的借貸金額
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      
      if (!entry) {
        return next(new Error(`第 ${i + 1} 筆分錄：分錄資料不存在`));
      }
      
      if (entry.debitAmount === 0 && entry.creditAmount === 0) {
        return next(new Error(`第 ${i + 1} 筆分錄：借方金額或貸方金額至少要有一個大於0`));
      }
      
      if (entry.debitAmount > 0 && entry.creditAmount > 0) {
        return next(new Error(`第 ${i + 1} 筆分錄：借方金額和貸方金額不能同時大於0`));
      }
    }
    
    // 更新總金額為借方或貸方總額
    this.totalAmount = Math.max(totalDebit, totalCredit);
  }
  
  next();
});

// 分錄序號唯一性驗證
TransactionGroupWithEntriesSchema.pre('save', function(this: ITransactionGroupWithEntries, next) {
  if (this.entries && this.entries.length > 0) {
    const sequences = this.entries.map(entry => entry.sequence);
    const uniqueSequences = Array.from(new Set(sequences));
    
    if (sequences.length !== uniqueSequences.length) {
      return next(new Error('分錄序號必須唯一'));
    }
    
    // 自動排序分錄
    this.entries.sort((a, b) => a.sequence - b.sequence);
  }
  
  next();
});

export default mongoose.model<ITransactionGroupWithEntries>('TransactionGroupWithEntries', TransactionGroupWithEntriesSchema);