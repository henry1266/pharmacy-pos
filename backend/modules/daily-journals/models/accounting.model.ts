import mongoose, { Schema, Types } from 'mongoose'
import type { IAccounting, IAccountingItem } from '@pharmacy-pos/shared/types/models'

export type AccountingStatus = 'pending' | 'completed'
export type AccountingShift = '早' | '中' | '晚'

export interface AccountingItemDocument extends Omit<IAccountingItem, 'categoryId'> {
  categoryId?: Types.ObjectId | string | null
  note?: string
  isAutoLinked?: boolean
}

export interface AccountingDocument
  extends mongoose.Document,
    Omit<IAccounting, '_id' | 'items' | 'createdBy'> {
  _id: Types.ObjectId
  shift: AccountingShift
  status: AccountingStatus
  items: AccountingItemDocument[]
  totalAmount: number
  createdBy: Types.ObjectId | string
  calculateTotalAmount(): number
  addItem(item: AccountingItemDocument): void
  removeItem(index: number): void
  updateStatus(status: AccountingStatus): void
}

interface AccountingModel extends mongoose.Model<AccountingDocument> {
  findByDateAndShift(date: Date, shift: AccountingShift): Promise<AccountingDocument | null>
  getRecordsByDateRange(
    startDate: Date,
    endDate: Date,
    status?: AccountingStatus,
  ): Promise<AccountingDocument[]>
  getMonthlyStats(year: number, month: number): Promise<unknown[]>
}

const AccountingItemSchema = new Schema<AccountingItemDocument>(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'AccountingCategory',
      default: null,
    },
    note: { type: String, default: '' },
    isAutoLinked: { type: Boolean, default: false },
  },
  {
    _id: false,
    id: false,
  },
)

const AccountingSchema = new Schema<AccountingDocument, AccountingModel>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true,
    },
    shift: {
      type: String,
      required: true,
      enum: ['早', '中', '晚'],
    },
    items: {
      type: [AccountingItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

AccountingSchema.methods.calculateTotalAmount = function calculateTotalAmount(this: AccountingDocument) {
  return this.items.reduce((sum: number, item: AccountingItemDocument) => sum + (item.amount ?? 0), 0)
}

AccountingSchema.methods.addItem = function addItem(this: AccountingDocument, item: AccountingItemDocument) {
  this.items.push(item)
  this.totalAmount = this.calculateTotalAmount()
}

AccountingSchema.methods.removeItem = function removeItem(this: AccountingDocument, index: number) {
  if (index >= 0 && index < this.items.length) {
    this.items.splice(index, 1)
    this.totalAmount = this.calculateTotalAmount()
  }
}

AccountingSchema.methods.updateStatus = function updateStatus(
  this: AccountingDocument,
  status: AccountingStatus,
) {
  this.status = status
  this.updatedAt = new Date()
}

AccountingSchema.statics.findByDateAndShift = function findByDateAndShift(
  this: AccountingModel,
  date: Date,
  shift: AccountingShift,
) {
  return this.findOne({ date, shift })
}

AccountingSchema.statics.getRecordsByDateRange = function getRecordsByDateRange(
  this: AccountingModel,
  startDate: Date,
  endDate: Date,
  status?: AccountingStatus,
) {
  const query: Record<string, unknown> = {
    date: { $gte: startDate, $lte: endDate },
  }

  if (status) {
    query.status = status
  }

  return this.find(query).sort({ date: -1, shift: 1 }).exec()
}

AccountingSchema.statics.getMonthlyStats = function getMonthlyStats(
  this: AccountingModel,
  year: number,
  month: number,
) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          date: '$date',
          shift: '$shift',
        },
        totalAmount: { $sum: '$totalAmount' },
        itemCount: { $sum: { $size: '$items' } },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalTransactions: { $sum: 1 },
        totalItems: { $sum: '$itemCount' },
        averagePerTransaction: { $avg: '$totalAmount' },
      },
    },
  ]).exec()
}

AccountingSchema.index({ date: 1, shift: 1 }, { unique: true })
AccountingSchema.index({ status: 1, date: -1 })
AccountingSchema.index({ createdBy: 1 })

export const AccountingModel = mongoose.model<AccountingDocument, AccountingModel>('Accounting', AccountingSchema)

export default AccountingModel
