import mongoose, { Schema, Model } from 'mongoose';
import { ICustomer, ICustomerDocument } from '../src/types/models';

// Customer Schema 定義
const CustomerSchema = new Schema<ICustomerDocument>({
  customerCode: {
    type: String,
    required: [true, '客戶代碼為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, '客戶姓名為必填項目'],
    trim: true,
    maxlength: [100, '客戶姓名不能超過100個字元']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        if (!email) return true; // 允許空值
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: '請提供有效的電子郵件地址'
    },
    sparse: true // 允許多個文檔有 null 值，但不允許重複的非 null 值
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // 允許空值
        const phoneRegex = /^[\d\-+()s]+$/;
        return phoneRegex.test(phone);
      },
      message: '請提供有效的電話號碼'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, '地址不能超過500個字元']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        if (!date) return true; // 允許空值
        return date <= new Date(); // 出生日期不能是未來
      },
      message: '出生日期不能是未來日期'
    }
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other'],
      message: '性別必須是 male、female 或 other'
    }
  },
  notes: {
    type: String,
    maxlength: [1000, '備註不能超過1000個字元']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, '總購買金額不能為負數']
  },
  lastPurchaseDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引設定
CustomerSchema.index({ customerCode: 1 }, { unique: true });
CustomerSchema.index({ name: 'text' });
CustomerSchema.index({ phone: 1 }, { sparse: true });
CustomerSchema.index({ email: 1 }, { sparse: true });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ lastPurchaseDate: -1 });

// 複合索引
CustomerSchema.index({ isActive: 1, lastPurchaseDate: -1 });
CustomerSchema.index({ name: 1, phone: 1 });

// 靜態方法：根據客戶代碼查找
CustomerSchema.statics.findByCustomerCode = function(customerCode: string) {
  return this.findOne({ customerCode: customerCode.toUpperCase(), isActive: true });
};

// 靜態方法：根據電話號碼查找
CustomerSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone, isActive: true });
};

// 靜態方法：根據電子郵件查找
CustomerSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// 靜態方法：搜尋客戶
CustomerSchema.statics.searchCustomers = function(searchTerm: string, options: any = {}) {
  const query: any = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { customerCode: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  return this.find(query)
    .sort(options.sort ?? { name: 1 })
    .limit(options.limit ?? 50);
};

// 靜態方法：獲取客戶統計
CustomerSchema.statics.getCustomerStats = async function() {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        totalPurchases: { $sum: '$totalPurchases' },
        averagePurchases: { $avg: '$totalPurchases' },
        customersWithPurchases: {
          $sum: { $cond: [{ $gt: ['$totalPurchases', 0] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] ?? {
    totalCustomers: 0,
    totalPurchases: 0,
    averagePurchases: 0,
    customersWithPurchases: 0
  };
};

// 靜態方法：獲取最近活躍客戶
CustomerSchema.statics.getRecentActiveCustomers = function(days: number = 30, limit: number = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    isActive: true,
    lastPurchaseDate: { $gte: cutoffDate }
  })
    .sort({ lastPurchaseDate: -1 })
    .limit(limit);
};

// 靜態方法：獲取高價值客戶
CustomerSchema.statics.getHighValueCustomers = function(minAmount: number = 10000, limit: number = 10) {
  return this.find({
    isActive: true,
    totalPurchases: { $gte: minAmount }
  })
    .sort({ totalPurchases: -1 })
    .limit(limit);
};

// 實例方法：更新購買記錄
CustomerSchema.methods.updatePurchaseRecord = function(amount: number): void {
  this.totalPurchases = (this.totalPurchases ?? 0) + amount;
  this.lastPurchaseDate = new Date();
};

// 實例方法：計算年齡
CustomerSchema.methods.getAge = function(): number | null {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// 實例方法：檢查是否為活躍客戶
CustomerSchema.methods.isActiveCustomer = function(days: number = 90): boolean {
  if (!this.lastPurchaseDate) return false;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.lastPurchaseDate >= cutoffDate;
};

// 實例方法：獲取客戶等級
CustomerSchema.methods.getCustomerTier = function(): string {
  const totalPurchases = this.totalPurchases ?? 0;
  
  if (totalPurchases >= 100000) return 'VIP';
  if (totalPurchases >= 50000) return 'Gold';
  if (totalPurchases >= 20000) return 'Silver';
  if (totalPurchases >= 5000) return 'Bronze';
  return 'Regular';
};

// 虛擬屬性：完整顯示名稱
CustomerSchema.virtual('displayName').get(function(this: ICustomerDocument) {
  return `${this.customerCode} - ${this.name}`;
});

// 虛擬屬性：年齡
CustomerSchema.virtual('age').get(function(this: ICustomerDocument) {
  return this.getAge();
});

// 虛擬屬性：客戶等級
CustomerSchema.virtual('customerTier').get(function(this: ICustomerDocument) {
  return this.getCustomerTier();
});

// 虛擬屬性：聯絡資訊
CustomerSchema.virtual('contactInfo').get(function(this: ICustomerDocument) {
  const contact: any = {};
  if (this.phone) contact.phone = this.phone;
  if (this.email) contact.email = this.email;
  if (this.address) contact.address = this.address;
  return contact;
});

// 虛擬屬性：是否為新客戶（30天內無購買記錄）
CustomerSchema.virtual('isNewCustomer').get(function(this: ICustomerDocument) {
  return !this.lastPurchaseDate;
});

// 中間件：客戶代碼自動轉大寫
CustomerSchema.pre<ICustomerDocument>('save', function(next) {
  if (this.customerCode) {
    this.customerCode = this.customerCode.toUpperCase();
  }
  next();
});

// 中間件：電子郵件自動轉小寫
CustomerSchema.pre<ICustomerDocument>('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// 中間件：驗證客戶代碼唯一性
CustomerSchema.pre<ICustomerDocument>('save', async function(next) {
  if (this.isNew || this.isModified('customerCode')) {
    const existingCustomer = await (this.constructor as ICustomerModel).findOne({
      customerCode: this.customerCode,
      _id: { $ne: this._id }
    });
    
    if (existingCustomer) {
      return next(new Error('客戶代碼已存在'));
    }
  }
  next();
});

// 擴展靜態方法介面
interface ICustomerModel extends Model<ICustomerDocument> {
  findByCustomerCode(customerCode: string): Promise<ICustomerDocument | null>;
  findByPhone(phone: string): Promise<ICustomerDocument | null>;
  findByEmail(email: string): Promise<ICustomerDocument | null>;
  searchCustomers(searchTerm: string, options?: any): Promise<ICustomerDocument[]>;
  getCustomerStats(): Promise<any>;
  getRecentActiveCustomers(days?: number, limit?: number): Promise<ICustomerDocument[]>;
  getHighValueCustomers(minAmount?: number, limit?: number): Promise<ICustomerDocument[]>;
}

// 創建並匯出模型
const Customer = mongoose.model<ICustomerDocument, ICustomerModel>('Customer', CustomerSchema);

export default Customer;
export type { ICustomer, ICustomerDocument, ICustomerModel };