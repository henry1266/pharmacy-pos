import mongoose, { Schema, Document } from 'mongoose';

// 產品分類介面
export interface IProductCategory {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 產品分類文檔介面
export interface IProductCategoryDocument extends IProductCategory, Document {
  _id: mongoose.Types.ObjectId;
}

// 產品分類資料模型
const ProductCategorySchema = new Schema<IProductCategoryDocument>({
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

export default mongoose.model<IProductCategoryDocument>('ProductCategory', ProductCategorySchema);