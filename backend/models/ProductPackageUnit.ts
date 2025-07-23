import mongoose, { Schema, Model } from 'mongoose';
import { ProductPackageUnit as IProductPackageUnit } from '@pharmacy-pos/shared/types/package';

// 擴展 Mongoose Document 介面
interface IProductPackageUnitDocument extends Omit<IProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>, mongoose.Document {
  productId: mongoose.Types.ObjectId;
}

// 擴展 Model 介面以包含自定義靜態方法
interface IProductPackageUnitModel extends Model<IProductPackageUnitDocument> {
  findByProductId(productId: string): Promise<IProductPackageUnitDocument[]>;
  findActiveByProductId(productId: string): Promise<IProductPackageUnitDocument[]>;
  findByProductIdAtDate(productId: string, date: Date): Promise<IProductPackageUnitDocument[]>;
}

// ProductPackageUnit Schema
const ProductPackageUnitSchema = new Schema<IProductPackageUnitDocument>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'baseproduct',
    required: true,
    index: true
  },
  unitName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  unitValue: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'unitValue must be an integer'
    }
  },
  isBaseUnit: {
    type: Boolean,
    default: false,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true,
  collection: 'productpackageunits'
});

// 複合索引：確保同一產品的單位名稱唯一（在有效期內）
ProductPackageUnitSchema.index(
  { productId: 1, unitName: 1, effectiveFrom: 1 }, 
  { 
    unique: true,
    name: 'productId_unitName_effectiveFrom_unique'
  }
);

// 複合索引：確保同一產品的 unitValue 唯一（在有效期內）
ProductPackageUnitSchema.index(
  { productId: 1, unitValue: 1, effectiveFrom: 1 },
  {
    unique: true,
    name: 'productId_unitValue_effectiveFrom_unique'
  }
);

// 複合索引：確保同一產品只有一個基礎單位（在有效期內）
ProductPackageUnitSchema.index(
  { productId: 1, isBaseUnit: 1, effectiveFrom: 1 },
  {
    unique: true,
    partialFilterExpression: { isBaseUnit: true },
    name: 'productId_baseUnit_effectiveFrom_unique'
  }
);

// 查詢優化索引
ProductPackageUnitSchema.index({ productId: 1, isActive: 1 });
ProductPackageUnitSchema.index({ productId: 1, effectiveFrom: 1, effectiveTo: 1 });

// 驗證中間件：確保基礎單位的 unitValue 為 1
ProductPackageUnitSchema.pre('save', function(next) {
  if (this.isBaseUnit && this.unitValue !== 1) {
    const error = new Error('Base unit must have unitValue of 1');
    return next(error);
  }
  next();
});

// 驗證中間件：確保 effectiveTo 大於 effectiveFrom
ProductPackageUnitSchema.pre('save', function(next) {
  if (this.effectiveTo && this.effectiveFrom && this.effectiveTo <= this.effectiveFrom) {
    const error = new Error('effectiveTo must be greater than effectiveFrom');
    return next(error);
  }
  next();
});

// 靜態方法：根據產品ID查找包裝單位（按 unitValue 從大到小排序）
ProductPackageUnitSchema.statics.findByProductId = function(productId: string): Promise<IProductPackageUnitDocument[]> {
  return this.find({ productId }).sort({ unitValue: -1 });
};

// 靜態方法：根據產品ID查找啟用的包裝單位（按 unitValue 從大到小排序）
ProductPackageUnitSchema.statics.findActiveByProductId = function(productId: string): Promise<IProductPackageUnitDocument[]> {
  return this.find({
    productId,
    isActive: true,
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gte: new Date() } }
    ]
  }).sort({ unitValue: -1 });
};

// 靜態方法：根據產品ID和指定日期查找包裝單位（支援歷史配置，按 unitValue 從大到小排序）
ProductPackageUnitSchema.statics.findByProductIdAtDate = function(
  productId: string,
  date: Date
): Promise<IProductPackageUnitDocument[]> {
  return this.find({
    productId,
    effectiveFrom: { $lte: date },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gte: date } }
    ]
  }).sort({ unitValue: -1 });
};

// 實例方法：檢查是否在指定日期有效
ProductPackageUnitSchema.methods.isValidAtDate = function(date: Date): boolean {
  const effectiveFrom = this.effectiveFrom || new Date(0);
  const effectiveTo = this.effectiveTo;
  
  return date >= effectiveFrom && (!effectiveTo || date <= effectiveTo);
};

// 創建模型
const ProductPackageUnitModel = mongoose.model<IProductPackageUnitDocument, IProductPackageUnitModel>(
  'ProductPackageUnit', 
  ProductPackageUnitSchema
);

// 雙重導出策略以確保兼容性
export default ProductPackageUnitModel;

// CommonJS 兼容性
module.exports = ProductPackageUnitModel;
module.exports.default = ProductPackageUnitModel;