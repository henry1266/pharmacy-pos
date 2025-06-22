import mongoose, { Schema, Model } from 'mongoose';
import { IBaseProductDocument, IProductDocument, IMedicineDocument } from '../src/types/models';

// 擴展 Model 介面以包含自定義靜態方法
interface IBaseProductModel extends Model<IBaseProductDocument> {
  findByCode(code: string): Promise<IBaseProductDocument | null>;
}

// 基礎產品 Schema (與原始 JavaScript 版本保持一致)
const BaseProductSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  shortCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  unit: {
    type: String
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'supplier'
  },
  minStock: {
    type: Number,
    default: 10
  },
  productType: {
    type: String,
    required: true,
    enum: ['product', 'medicine']
  },
  date: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  discriminatorKey: 'productType',
  timestamps: true
});

// 靜態方法
BaseProductSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code });
};

// 創建基礎模型
const BaseProduct = mongoose.model<IBaseProductDocument, IBaseProductModel>('baseproduct', BaseProductSchema);

// 商品擴展模型
const Product = BaseProduct.discriminator<IProductDocument>('product', new Schema({
  barcode: {
    type: String
  }
}));

// 藥品擴展模型
const Medicine = BaseProduct.discriminator<IMedicineDocument>('medicine', new Schema({
  barcode: {
    type: String
  },
  healthInsuranceCode: {
    type: String
  },
  healthInsurancePrice: {
    type: Number,
    default: 0
  }
}));

export default BaseProduct;
module.exports = { BaseProduct, Product, Medicine };
module.exports.default = BaseProduct;
export { Product, Medicine };