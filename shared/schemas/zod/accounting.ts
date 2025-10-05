import { z } from 'zod'
import { zodId } from '../../utils/zodUtils'

const timestampSchema = z.union([z.string(), z.date()])
const timestampInputSchema = z.union([z.string(), z.date()])

export const accountingItemSchema = z
  .object({
    amount: z.number(),
    category: z.string(),
    categoryId: z.string().optional(),
    notes: z.string().optional(),
    note: z.string().optional(),
    isAutoLinked: z.boolean().optional(),
  })
  .passthrough()

export const unaccountedSaleSchema = z
  .object({
    _id: zodId.optional(),
    lastUpdated: timestampSchema,
    product: z
      .object({
        _id: zodId.optional(),
        code: z.string().optional(),
        name: z.string().optional(),
      })
      .optional(),
    quantity: z.number(),
    totalAmount: z.number(),
    saleNumber: z.string(),
  })
  .passthrough()

export const accountingRecordSchema = z
  .object({
    _id: zodId,
    date: timestampSchema,
    shift: z.string().optional(),
    status: z.string().optional(),
    items: z.array(accountingItemSchema).optional(),
    totalAmount: z.number().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough()

export const accountingRecordCreateSchema = z
  .object({
    date: timestampInputSchema,
    shift: z.string(),
    status: z.string().optional(),
    items: z.array(accountingItemSchema).optional(),
  })
  .passthrough()

export const accountingRecordUpdateSchema = accountingRecordCreateSchema.partial()

export const accountingSearchSchema = z
  .object({
    startDate: timestampInputSchema.optional(),
    endDate: timestampInputSchema.optional(),
    shift: z.string().optional(),
    date: timestampInputSchema.optional(),
    search: z.string().optional(),
  })
  .passthrough()

export const accountingCategorySchema = z
  .object({
    _id: zodId,
    name: z.string(),
    code: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough()

export const accountingCategoryCreateSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough()

export const accountingCategoryUpdateSchema = accountingCategoryCreateSchema.partial()

export default {
  accountingItemSchema,
  accountingRecordSchema,
  accountingRecordCreateSchema,
  accountingRecordUpdateSchema,
  accountingSearchSchema,
  accountingCategorySchema,
  accountingCategoryCreateSchema,
  accountingCategoryUpdateSchema,
  unaccountedSaleSchema,
}
