import mongoose, { Schema } from 'mongoose';
import { IAccountingDocument, IAccountingItem } from '../src/types/models';

// 記帳系統資料模型
const AccountingSchema = new Schema<IAccountingDocument>({
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed"],
    default: "pending",
    index: true
  },
  shift: {
    type: String,
    required: true,
    enum: ["早", "中", "晚"]
  },
  items: [{
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "AccountingCategory"
    },
    note: {
      type: String,
      default: ""
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: Schema.Types.Mixed, // Keep Mixed for bypass user compatibility
    ref: "User",
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
}, { timestamps: true });

// 實例方法：計算總金額
AccountingSchema.methods.calculateTotalAmount = function(
  this: IAccountingDocument
): number {
  return this.items.reduce((sum, item) => sum + item.amount, 0);
};

// 實例方法：添加項目
AccountingSchema.methods.addItem = function(
  this: IAccountingDocument,
  item: IAccountingItem
): void {
  this.items.push(item);
  this.totalAmount = this.calculateTotalAmount();
};

// 實例方法：移除項目
AccountingSchema.methods.removeItem = function(
  this: IAccountingDocument,
  index: number
): void {
  if (index >= 0 && index < this.items.length) {
    this.items.splice(index, 1);
    this.totalAmount = this.calculateTotalAmount();
  }
};

// 實例方法：更新狀態
AccountingSchema.methods.updateStatus = function(
  this: IAccountingDocument,
  status: 'pending' | 'completed'
): void {
  this.status = status;
  this.updatedAt = new Date();
};

// 靜態方法：根據日期和班別查找記錄
AccountingSchema.statics.findByDateAndShift = function(
  date: Date,
  shift: '早' | '中' | '晚'
) {
  return this.findOne({ date, shift });
};

// 靜態方法：獲取日期範圍內的記錄
AccountingSchema.statics.getRecordsByDateRange = function(
  startDate: Date,
  endDate: Date,
  status?: 'pending' | 'completed'
) {
  const query: any = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).sort({ date: -1, shift: 1 });
};

// 靜態方法：獲取月度統計
AccountingSchema.statics.getMonthlyStats = function(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          date: '$date',
          shift: '$shift'
        },
        totalAmount: { $sum: '$totalAmount' },
        itemCount: { $sum: { $size: '$items' } }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalTransactions: { $sum: 1 },
        totalItems: { $sum: '$itemCount' },
        averagePerTransaction: { $avg: '$totalAmount' }
      }
    }
  ]);
};

// 確保同一日期和班別只能有一筆記錄
AccountingSchema.index({ date: 1, shift: 1 }, { unique: true });

// 其他索引
AccountingSchema.index({ status: 1, date: -1 });
AccountingSchema.index({ createdBy: 1 });

const Accounting = mongoose.model<IAccountingDocument>("Accounting", AccountingSchema);

// 雙重導出策略以確保兼容性
export default Accounting;

// CommonJS 兼容性
module.exports = Accounting;
module.exports.default = Accounting;