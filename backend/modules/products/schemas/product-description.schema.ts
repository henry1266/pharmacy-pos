import { z } from 'zod'
import { zodId } from '@pharmacy-pos/shared/utils/zodUtils'

export const productDescriptionParamsSchema = z.object({
  productId: zodId.describe('產品識別碼'),
})

export const productDescriptionUpdateSchema = z.object({
  summary: z.string().max(2000, '摘要最多 2000 字').optional(),
  description: z.string().max(10000, '內容最多 10000 字').optional(),
  isAutoSave: z.boolean().optional(),
})

export type ProductDescriptionParams = z.infer<typeof productDescriptionParamsSchema>
export type ProductDescriptionUpdateInput = z.infer<typeof productDescriptionUpdateSchema>

export const productDescriptionResponseSchema = z.object({
  summary: z.string(),
  description: z.string(),
  wordCount: z.number(),
  summaryWordCount: z.number(),
  lastEditedBy: z.string().nullable(),
  updatedAt: z.date().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type ProductDescriptionDTO = z.infer<typeof productDescriptionResponseSchema>

export const emptyProductDescription: ProductDescriptionDTO = {
  summary: '',
  description: '',
  wordCount: 0,
  summaryWordCount: 0,
  lastEditedBy: null,
  updatedAt: null,
}
