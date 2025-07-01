import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount2 extends Document {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  organizationId?: string; // 機構 ID（可選，支援個人帳戶）
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const Account2Schema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'bank', 'credit', 'investment', 'other'],
    default: 'cash'
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  initialBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'TWD',
    maxlength: 3
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'accounts2'
});

// 索引
Account2Schema.index({ createdBy: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, isActive: 1 });
Account2Schema.index({ organizationId: 1, createdBy: 1, isActive: 1 });
Account2Schema.index({ type: 1, isActive: 1 });

export default mongoose.model<IAccount2>('Account2', Account2Schema);