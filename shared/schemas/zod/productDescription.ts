import { z } from 'zod';
import { zodId } from '../../utils/zodUtils';

export const productDescriptionParamsSchema = z.object({
  productId: zodId.describe('Product identifier'),
});

export const productDescriptionUpdateSchema = z.object({
  summary: z.string().max(2000, '摘要需少於 2000 字').optional(),
  description: z.string().max(10000, '詳細內容需少於 10000 字').optional(),
  isAutoSave: z.boolean().optional(),
});

export const productDescriptionResponseSchema = z.object({
  summary: z.string(),
  description: z.string(),
  wordCount: z.number(),
  summaryWordCount: z.number(),
  lastEditedBy: z.string().nullable(),
  updatedAt: z.union([z.string(), z.date()]).nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ProductDescriptionParams = z.infer<typeof productDescriptionParamsSchema>;
export type ProductDescriptionUpdateInput = z.infer<typeof productDescriptionUpdateSchema>;
export type ProductDescriptionDTO = z.infer<typeof productDescriptionResponseSchema>;

export const emptyProductDescription: ProductDescriptionDTO = {
  summary: '',
  description: '',
  wordCount: 0,
  summaryWordCount: 0,
  lastEditedBy: null,
  updatedAt: null,
};
