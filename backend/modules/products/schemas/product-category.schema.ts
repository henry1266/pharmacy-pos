import { z } from 'zod'
import { zodId } from '@pharmacy-pos/shared/utils/zodUtils'

const optionalBoolean = z.coerce.boolean().optional()
const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'number') {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}, z.number().int().min(0).max(9999).optional())

export const productCategoryIdSchema = z.object({
  id: zodId.describe('產品分類識別碼'),
})

export const productCategoryCreateSchema = z.object({
  name: z.string().min(1, '請輸入分類名稱').max(100, '分類名稱最多 100 字'),
  description: z.string().max(1000, '分類描述最多 1000 字').optional(),
  isActive: optionalBoolean,
  order: optionalNumber,
})

export const productCategoryUpdateSchema = productCategoryCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  '請至少提供一項要更新的欄位',
)

export const productCategoryResponseSchema = z.object({
  _id: zodId,
  name: z.string(),
  description: z.string().optional(),
  order: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type ProductCategoryCreateInput = z.infer<typeof productCategoryCreateSchema>
export type ProductCategoryUpdateInput = z.infer<typeof productCategoryUpdateSchema>
export type ProductCategoryIdParams = z.infer<typeof productCategoryIdSchema>
export type ProductCategoryDTO = z.infer<typeof productCategoryResponseSchema>
