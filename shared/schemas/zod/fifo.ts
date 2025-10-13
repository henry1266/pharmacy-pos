import { z } from 'zod';
import { saleItemResponseSchema } from './sale';

export const fifoProfitSchema = z
  .object({
    totalCost: z.number().optional(),
    totalRevenue: z.number().optional(),
    totalProfit: z.number().optional(),
    grossProfit: z.number().optional(),
    profitMargin: z.string().optional(),
    totalProfitMargin: z.string().optional(),
  })
  .passthrough();

export const fifoSaleItemSchema = saleItemResponseSchema.extend({
  fifoProfit: fifoProfitSchema.optional(),
});

export const fifoSaleSummarySchema = z.object({
  totalCost: z.number().nullable().optional(),
  totalRevenue: z.number().nullable().optional(),
  totalProfit: z.number().nullable().optional(),
  grossProfit: z.number().nullable().optional(),
  totalProfitMargin: z.string().optional(),
});

export const fifoSaleResponseSchema = z
  .object({
    success: z.literal(true),
    items: z.array(fifoSaleItemSchema),
    summary: fifoSaleSummarySchema.optional(),
  })
  .passthrough();

export const fifoErrorResponseSchema = z
  .object({
    msg: z.string(),
  })
  .passthrough();

export type FifoSaleResponse = z.infer<typeof fifoSaleResponseSchema>;
