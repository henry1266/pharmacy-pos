import mongoose, { Schema, Types } from 'mongoose'
import type { IAccountingCategory as SharedAccountingCategory } from '@pharmacy-pos/shared/types/models'

export interface AccountingCategoryDocument
  extends mongoose.Document,
    Omit<SharedAccountingCategory, '_id' | 'createdAt' | 'updatedAt'> {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  code?: string
  type?: string
}

const AccountingCategorySchema = new Schema<AccountingCategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: undefined,
    },
    type: {
      type: String,
      trim: true,
      default: undefined,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    order: {
      type: Number,
      default: 999,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

AccountingCategorySchema.index({ name: 1 }, { unique: true })
AccountingCategorySchema.index({ code: 1 }, { sparse: true })
AccountingCategorySchema.index({ isActive: 1, order: 1 })

export const AccountingCategoryModel = mongoose.model<AccountingCategoryDocument>(
  'AccountingCategory',
  AccountingCategorySchema,
)

export default AccountingCategoryModel
