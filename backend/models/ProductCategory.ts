import mongoose, { Schema, Document } from 'mongoose';
import { IProductCategoryDocument } from '../src/types/models';

// 產品分類資料模型
const ProductCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 999 // 預設排序值，新增的類別會排在最後
  },
  isActive: {
    type: Boolean,
    default: true
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

// 添加方法
ProductCategorySchema.methods.updateOrder = function(newOrder: number): void {
  this.order = newOrder;
};

ProductCategorySchema.methods.toggleActive = function(): void {
  this.isActive = !this.isActive;
};

const ProductCategory = mongoose.model<IProductCategoryDocument>('ProductCategory', ProductCategorySchema);

export default ProductCategory;