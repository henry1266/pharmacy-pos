import mongoose, { Schema } from 'mongoose';
import { IProductCategory, IProductCategoryDocument } from '../src/types/models';

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

// 實例方法：更新排序
ProductCategorySchema.methods.updateOrder = function(
  this: IProductCategoryDocument,
  newOrder: number
): void {
  this.order = newOrder;
  this.updatedAt = new Date();
};

// 實例方法：切換啟用狀態
ProductCategorySchema.methods.toggleActive = function(
  this: IProductCategoryDocument
): void {
  this.isActive = !this.isActive;
  this.updatedAt = new Date();
};

// 靜態方法：獲取活躍類別
ProductCategorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// 靜態方法：根據名稱查找類別
ProductCategorySchema.statics.findByName = function(name: string) {
  return this.findOne({ name: name.trim() });
};

// 靜態方法：重新排序所有類別
ProductCategorySchema.statics.reorderCategories = async function(categoryIds: mongoose.Types.ObjectId[]) {
  const promises = categoryIds.map((id, index) => 
    this.findByIdAndUpdate(id, { order: index + 1, updatedAt: new Date() })
  );
  
  return Promise.all(promises);
};

// 靜態方法：獲取下一個排序號
ProductCategorySchema.statics.getNextOrder = async function(): Promise<number> {
  const lastCategory = await this.findOne().sort({ order: -1 });
  return lastCategory ? lastCategory.order + 1 : 1;
};

// 靜態方法：獲取類別統計
ProductCategorySchema.statics.getCategoryStats = async function() {
  const BaseProduct = mongoose.model('baseproduct');
  
  return this.aggregate([
    {
      $lookup: {
        from: 'baseproducts',
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        order: 1,
        isActive: 1,
        productCount: { $size: '$products' },
        activeProductCount: {
          $size: {
            $filter: {
              input: '$products',
              cond: { $eq: ['$$this.isActive', true] }
            }
          }
        }
      }
    },
    { $sort: { order: 1 } }
  ]);
};

// 索引
ProductCategorySchema.index({ name: 1 });
ProductCategorySchema.index({ order: 1 });
ProductCategorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IProductCategoryDocument>('ProductCategory', ProductCategorySchema);