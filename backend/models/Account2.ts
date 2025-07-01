import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount2 extends Document {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  isActive: boolean;
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
Account2Schema.index({ type: 1, isActive: 1 });

export default mongoose.model<IAccount2>('Account2', Account2Schema);