import mongoose, { Schema } from 'mongoose';
import { IAccountingCategoryDocument } from '../src/types/models';

// 記帳名目類別資料模型
const AccountingCategorySchema = new Schema<IAccountingCategoryDocument>({
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
AccountingCategorySchema.methods.updateOrder = function(
  this: IAccountingCategoryDocument,
  newOrder: number
): void {
  this.order = newOrder;
  this.updatedAt = new Date();
};

// 實例方法：切換啟用狀態
AccountingCategorySchema.methods.toggleActive = function(
  this: IAccountingCategoryDocument
): void {
  this.isActive = !this.isActive;
  this.updatedAt = new Date();
};

// 靜態方法：獲取活躍類別
AccountingCategorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// 靜態方法：根據名稱查找類別
AccountingCategorySchema.statics.findByName = function(name: string) {
  return this.findOne({ name: name.trim() });
};

// 靜態方法：重新排序所有類別
AccountingCategorySchema.statics.reorderCategories = async function(categoryIds: mongoose.Types.ObjectId[]) {
  const promises = categoryIds.map((id, index) => 
    this.findByIdAndUpdate(id, { order: index + 1, updatedAt: new Date() })
  );
  
  return Promise.all(promises);
};

// 靜態方法：獲取下一個排序號
AccountingCategorySchema.statics.getNextOrder = async function(): Promise<number> {
  const lastCategory = await this.findOne().sort({ order: -1 });
  return lastCategory ? lastCategory.order + 1 : 1;
};

// 索引
AccountingCategorySchema.index({ name: 1 });
AccountingCategorySchema.index({ order: 1 });
AccountingCategorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model<IAccountingCategoryDocument>('AccountingCategory', AccountingCategorySchema);