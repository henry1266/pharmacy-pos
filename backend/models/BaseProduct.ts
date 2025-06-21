import mongoose, { Schema, Model } from 'mongoose';
import { IBaseProduct, IProduct, IMedicine, IBaseProductDocument } from '../src/types/models';

// BaseProduct Schema 定義
const BaseProductSchema = new Schema<IBaseProductDocument>({
  productCode: {
    type: String,
    required: [true, '產品代碼為必填項目'],
    unique: true,
    trim: true,
    uppercase: true
  },
  productName: {
    type: String,
    required: [true, '產品名稱為必填項目'],
    trim: true,
    maxlength: [200, '產品名稱不能超過200個字元']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: [true, '產品分類為必填項目']
  },
  description: {
    type: String,
    maxlength: [1000, '產品描述不能超過1000個字元']
  },
  unit: {
    type: String,
    required: [true, '單位為必填項目'],
    trim: true,
    maxlength: [20, '單位不能超過20個字元']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '標籤不能超過50個字元']
  }]
}, {
  discriminatorKey: 'productType',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引設定
BaseProductSchema.index({ productCode: 1 }, { unique: true });
BaseProductSchema.index({ productName: 'text' });
BaseProductSchema.index({ category: 1 });
BaseProductSchema.index({ isActive: 1 });
BaseProductSchema.index({ tags: 1 });

// 靜態方法：根據代碼查找產品
BaseProductSchema.statics.findByCode = function(productCode: string) {
  return this.findOne({ productCode: productCode.toUpperCase(), isActive: true });
};

// 靜態方法：根據分類查找產品
BaseProductSchema.statics.findByCategory = function(categoryId: string) {
  return this.find({ category: categoryId, isActive: true });
};

// 靜態方法：搜尋產品
BaseProductSchema.statics.searchProducts = function(searchTerm: string, options: any = {}) {
  const query: any = {
    isActive: true,
    $or: [
      { productName: { $regex: searchTerm, $options: 'i' } },
      { productCode: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  return this.find(query)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort(options.sort ?? { productName: 1 })
    .limit(options.limit ?? 50);
};

// 虛擬屬性：完整顯示名稱
BaseProductSchema.virtual('displayName').get(function(this: IBaseProductDocument) {
  return `${this.productCode} - ${this.productName}`;
});

// 中間件：產品代碼自動轉大寫
BaseProductSchema.pre<IBaseProductDocument>('save', function(next) {
  if (this.productCode) {
    this.productCode = this.productCode.toUpperCase();
  }
  next();
});

// 擴展靜態方法介面
interface IBaseProductModel extends Model<IBaseProductDocument> {
  findByCode(productCode: string): Promise<IBaseProductDocument | null>;
  findByCategory(categoryId: string): Promise<IBaseProductDocument[]>;
  searchProducts(searchTerm: string, options?: any): Promise<IBaseProductDocument[]>;
}

// 創建基礎模型
const BaseProduct = mongoose.model<IBaseProductDocument, IBaseProductModel>('BaseProduct', BaseProductSchema);

// 一般商品 Schema 擴展
const ProductSchema = new Schema({
  costPrice: {
    type: Number,
    required: [true, '成本價格為必填項目'],
    min: [0, '成本價格不能為負數']
  },
  sellingPrice: {
    type: Number,
    required: [true, '售價為必填項目'],
    min: [0, '售價不能為負數']
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, '最小庫存不能為負數']
  },
  maxStock: {
    type: Number,
    min: [0, '最大庫存不能為負數']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true // 允許多個文檔有 null 值
  }
});

// 商品模型驗證：最大庫存必須大於最小庫存
ProductSchema.pre('save', function(next) {
  if (this.maxStock && this.minStock && this.maxStock <= this.minStock) {
    next(new Error('最大庫存必須大於最小庫存'));
  } else {
    next();
  }
});

// 虛擬屬性：毛利率
ProductSchema.virtual('profitMargin').get(function() {
  if (this.costPrice && this.sellingPrice && this.costPrice > 0) {
    return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(2);
  }
  return 0;
});

// 藥品 Schema 擴展
const MedicineSchema = new Schema({
  costPrice: {
    type: Number,
    required: [true, '成本價格為必填項目'],
    min: [0, '成本價格不能為負數']
  },
  sellingPrice: {
    type: Number,
    required: [true, '售價為必填項目'],
    min: [0, '售價不能為負數']
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, '最小庫存不能為負數']
  },
  maxStock: {
    type: Number,
    min: [0, '最大庫存不能為負數']
  },
  activeIngredient: {
    type: String,
    trim: true,
    maxlength: [200, '主要成分不能超過200個字元']
  },
  dosageForm: {
    type: String,
    trim: true,
    maxlength: [50, '劑型不能超過50個字元']
  },
  strength: {
    type: String,
    trim: true,
    maxlength: [50, '強度不能超過50個字元']
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [100, '製造商不能超過100個字元']
  },
  licenseNumber: {
    type: String,
    trim: true,
    maxlength: [50, '許可證號不能超過50個字元']
  },
  expiryDate: {
    type: Date
  },
  storageConditions: {
    type: String,
    trim: true,
    maxlength: [200, '儲存條件不能超過200個字元']
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  healthInsuranceCode: {
    type: String,
    trim: true,
    maxlength: [20, '健保代碼不能超過20個字元']
  },
  healthInsurancePrice: {
    type: Number,
    min: [0, '健保價格不能為負數'],
    default: 0
  }
});

// 藥品模型驗證：處方藥必須有許可證號
MedicineSchema.pre('save', function(next) {
  if (this.prescriptionRequired && !this.licenseNumber) {
    next(new Error('處方藥必須提供許可證號'));
  } else {
    next();
  }
});

// 虛擬屬性：是否即將過期（30天內）
MedicineSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow;
});

// 虛擬屬性：是否已過期
MedicineSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
});

// 創建 discriminator 模型
const Product = BaseProduct.discriminator('product', ProductSchema);
const Medicine = BaseProduct.discriminator('medicine', MedicineSchema);

// 型別定義
interface IProductDocument extends IBaseProductDocument, IProduct {}
interface IMedicineDocument extends IBaseProductDocument, IMedicine {}

export default BaseProduct;
export { Product, Medicine };
export type { IBaseProduct, IProduct, IMedicine, IBaseProductDocument, IProductDocument, IMedicineDocument };