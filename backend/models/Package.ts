import mongoose, { Schema, Document } from 'mongoose';
import { Package as IPackage, PackageItem } from '../../shared/types/package';

// 套餐項目 Schema
const PackageItemSchema = new Schema<PackageItem>({
  productId: { type: String, required: true },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  priceMode: {
    type: String,
    required: true,
    enum: ['unit', 'subtotal'],
    default: 'unit'
  }
});

// 套餐 Schema
const PackageSchema = new Schema<IPackage & Document>({
  code: {
    type: String,
    required: true,
    unique: true,
    match: /^T\d{5}$/ // T10001 格式驗證
  },
  shortCode: { type: String, trim: true }, // 套餐簡碼，用戶自定義
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  items: { 
    type: [PackageItemSchema], 
    required: true,
    validate: {
      validator: function(items: PackageItem[]) {
        return items && items.length > 0;
      },
      message: '套餐必須包含至少一個產品項目'
    }
  },
  totalPrice: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
    validate: {
      validator: function(value: number) {
        return value >= 0;
      },
      message: '套餐總價不能為負數'
    }
  },
  isActive: { type: Boolean, default: true },
  category: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  createdBy: { type: String },
  updatedBy: { type: String }
}, {
  timestamps: true, // 自動添加 createdAt 和 updatedAt
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引設置
PackageSchema.index({ code: 1 });
PackageSchema.index({ name: 1 });
PackageSchema.index({ isActive: 1 });
PackageSchema.index({ category: 1 });
PackageSchema.index({ tags: 1 });
PackageSchema.index({ createdAt: -1 });

// 中間件：計算套餐總價
PackageSchema.pre('save', function(next) {
  // 計算套餐總價（各項目小計的加總）
  this.totalPrice = this.items.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  next();
});

// 靜態方法：生成下一個套餐代碼
PackageSchema.statics.generateNextCode = async function(): Promise<string> {
  const lastPackage = await this.findOne({}, {}, { sort: { code: -1 } });
  
  if (!lastPackage) {
    return 'T10001';
  }

  const lastNumber = parseInt(lastPackage.code.substring(1));
  const nextNumber = lastNumber + 1;
  return `T${nextNumber.toString().padStart(5, '0')}`;
};

// 實例方法：計算原始總價（基於單價×數量）
PackageSchema.methods.getOriginalPrice = function(): number {
  return this.items.reduce((sum: number, item: PackageItem) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);
};

// 實例方法：獲取套餐摘要
PackageSchema.methods.getSummary = function(): string {
  const itemCount = this.items.length;
  const totalQuantity = this.items.reduce((sum: number, item: PackageItem) => sum + item.quantity, 0);
  return `${itemCount} 種商品，共 ${totalQuantity} 件`;
};

export const Package = mongoose.model<IPackage & Document>('Package', PackageSchema);