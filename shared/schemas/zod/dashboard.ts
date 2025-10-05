import { z } from 'zod'
import { zodId } from '../../utils/zodUtils'

const timestampSchema = z.union([z.string(), z.date()])

export const lowStockWarningSchema = z
  .object({
    productId: zodId,
    productCode: z.string(),
    productName: z.string(),
    currentStock: z.number(),
    minStock: z.number(),
  })
  .passthrough()

export const topProductSchema = z
  .object({
    productId: zodId.optional(),
    productCode: z.string(),
    productName: z.string(),
    quantity: z.number(),
    revenue: z.number(),
  })
  .passthrough()

export const recentSaleSchema = z
  .object({
    id: zodId,
    saleNumber: z.string().optional(),
    customerName: z.string(),
    totalAmount: z.number(),
    date: timestampSchema,
    paymentStatus: z.string(),
  })
  .passthrough()

export const salesSummarySchema = z.object({
  total: z.number(),
  today: z.number(),
  month: z.number(),
})

export const countsSchema = z.object({
  products: z.number(),
  customers: z.number(),
  suppliers: z.number(),
  orders: z.number(),
})

export const dashboardSummarySchema = z
  .object({
    salesSummary: salesSummarySchema,
    counts: countsSchema,
    lowStockWarnings: z.array(lowStockWarningSchema),
    topProducts: z.array(topProductSchema),
    recentSales: z.array(recentSaleSchema),
  })
  .passthrough()

export const salesTrendEntrySchema = z.object({
  date: z.string(),
  amount: z.number(),
  count: z.number(),
})

export const categorySalesSchema = z.object({
  category: z.string(),
  amount: z.number(),
})

export const salesTrendResponseSchema = z
  .object({
    salesTrend: z.array(salesTrendEntrySchema),
    categorySales: z.array(categorySalesSchema),
  })
  .passthrough()

export default {
  lowStockWarningSchema,
  topProductSchema,
  recentSaleSchema,
  salesSummarySchema,
  countsSchema,
  dashboardSummarySchema,
  salesTrendEntrySchema,
  categorySalesSchema,
  salesTrendResponseSchema,
}
