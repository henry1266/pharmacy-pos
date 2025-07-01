import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory2 extends Document {
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  icon?: string;
  color?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const Category2Schema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category2',
    default: null
  },
  icon: {
    type: String,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    trim: true,
    maxlength: 7, // #FFFFFF 格式
    match: /^#[0-9A-F]{6}$/i
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isDefault: {
    type: Boolean,
    required: true,
    default: false
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  sortOrder: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'categories2'
});

// 索引
Category2Schema.index({ createdBy: 1, type: 1, isActive: 1 });
Category2Schema.index({ parentId: 1, sortOrder: 1 });
Category2Schema.index({ type: 1, sortOrder: 1 });

// 虛擬欄位：子類別
Category2Schema.virtual('children', {
  ref: 'Category2',
  localField: '_id',
  foreignField: 'parentId'
});

// 確保 JSON 輸出包含虛擬欄位
Category2Schema.set('toJSON', { virtuals: true });
Category2Schema.set('toObject', { virtuals: true });

export default mongoose.model<ICategory2>('Category2', Category2Schema);