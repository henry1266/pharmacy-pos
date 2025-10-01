import { z } from 'zod';

// 銷售項目 Schema
export const saleItemSchema = z.object({
  product: z.string()
    .min(24, { message: '產品 ID 長度必須為 24 個字符' })
    .max(24, { message: '產品 ID 長度必須為 24 個字符' }),
  quantity: z.number()
    .min(0.001, { message: '數量必須大於 0' })
    .max(999999, { message: '數量不能超過 999999' }),
  price: z.number()
    .min(0, { message: '價格不能為負數' })
    .max(999999.99, { message: '價格不能超過 999999.99' }),
  discount: z.number()
    .min(0, { message: '折扣不能為負數' })
    .max(999999.99, { message: '折扣不能超過 999999.99' })
    .optional(),
  subtotal: z.number()
    .min(0, { message: '小計不能為負數' })
    .max(9999999.99, { message: '小計不能超過 9999999.99' }),
  notes: z.string()
    .max(500, { message: '備註不能超過 500 個字符' })
    .optional(),
});

// 創建銷售請求 Schema
export const createSaleSchema = z.object({
  saleNumber: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  customer: z.string().optional(),
  items: z.array(saleItemSchema)
    .min(1, { message: '銷售項目不能為空' })
    .max(100, { message: '銷售項目不能超過 100 個' }),
  totalAmount: z.number()
    .min(0, { message: '總金額不能為負數' })
    .max(9999999.99, { message: '總金額不能超過 9999999.99' }),
  discount: z.number()
    .min(0, { message: '折扣不能為負數' })
    .max(9999999.99, { message: '折扣不能超過 9999999.99' })
    .optional(),
  paymentMethod: z.enum([
    'cash',
    'card',
    'transfer',
    'other',
    'credit_card',
    'debit_card',
    'mobile_payment'
  ], { message: '支付方式不正確' }),
  paymentStatus: z.enum([
    'paid',
    'pending',
    'partial',
    'cancelled'
  ], { message: '支付狀態不正確' })
    .optional(),
  notes: z.string()
    .max(1000, { message: '備註不能超過 1000 個字符' })
    .optional(),
});

// 更新銷售請求 Schema
export const updateSaleSchema = createSaleSchema.partial();

// 銷售查詢 Schema
export const saleQuerySchema = z.object({
  search: z.string().optional(),
  wildcardSearch: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export default {
  saleItemSchema,
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
};