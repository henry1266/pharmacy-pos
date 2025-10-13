import { z } from 'zod';

export const objectIdSchema = z.string().min(24, { message: 'ID 長度需為 24 字元' }).max(24, { message: 'ID 長度需為 24 字元' });
export const timestampSchema = z.union([z.string(), z.date()]);

const paymentMethodValues = ['cash', 'card', 'transfer', 'other', 'credit_card', 'debit_card', 'mobile_payment'] as const;
const paymentStatusValues = ['paid', 'pending', 'partial', 'cancelled'] as const;
const saleLifecycleStatusValues = ['completed', 'pending', 'cancelled'] as const;

export const paymentMethodSchema = z.enum(paymentMethodValues, { message: '付款方式無效' });
export const paymentStatusSchema = z.enum(paymentStatusValues, { message: '付款狀態缺失' });
export const saleLifecycleStatusSchema = z.enum(saleLifecycleStatusValues);

// 銷售明細 Schema
export const saleItemSchema = z.object({
  product: objectIdSchema,
  quantity: z
    .number()
    .min(0.001, { message: '數量必須大於 0' })
    .max(999999, { message: '數量不可超過 999999' }),
  price: z
    .number()
    .min(0, { message: '單價不可為負值' })
    .max(999999.99, { message: '單價不可超過 999999.99' }),
  unitPrice: z
    .number()
    .min(0, { message: '單價不可為負值' })
    .max(999999.99, { message: '單價不可超過 999999.99' })
    .optional(),
  discount: z
    .number()
    .min(0, { message: '折扣金額不可為負值' })
    .max(999999.99, { message: '折扣金額不可超過 999999.99' })
    .optional(),
  subtotal: z
    .number()
    .min(0, { message: '小計不可為負值' })
    .max(9999999.99, { message: '小計不可超過 9999999.99' }),
  notes: z
    .string()
    .max(500, { message: '備註不可超過 500 字元' })
    .optional(),
});

export const saleItemResponseSchema = saleItemSchema
  .extend({
    _id: objectIdSchema.optional(),
    product: z.union([
      objectIdSchema,
      z
        .object({
          _id: objectIdSchema.optional(),
        })
        .passthrough(),
    ]),
  })
  .passthrough();

// 建立銷售請求 Schema
const idOrStringSchema = z.union([objectIdSchema, z.string().min(1)]);

export const createSaleSchema = z.object({
  saleNumber: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  customer: idOrStringSchema.optional(),
  items: z
    .array(saleItemSchema)
    .min(1, { message: '銷售品項至少一筆' })
    .max(100, { message: '銷售品項不可超過 100 筆' }),
  totalAmount: z
    .number()
    .min(0, { message: '總金額不得小於 0' })
    .max(9999999.99, { message: '總金額不得超過 9999999.99' }),
  discount: z
    .number()
    .min(0, { message: '折扣金額不可為負值' })
    .max(9999999.99, { message: '折扣金額不可超過 9999999.99' })
    .optional(),
  discountAmount: z
    .number()
    .min(0, { message: '折扣金額不可為負值' })
    .max(9999999.99, { message: '折扣金額不可超過 9999999.99' })
    .optional(),
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema.optional(),
  status: saleLifecycleStatusSchema.optional(),
  notes: z.string().max(1000, { message: '備註不可超過 1000 字元' }).optional(),
  cashier: idOrStringSchema.optional(),
  createdBy: idOrStringSchema.optional(),
  user: idOrStringSchema.optional(),
});

// 更新銷售請求 Schema
export const updateSaleSchema = createSaleSchema.partial();

// 銷售查詢 Schema
export const saleQuerySchema = z.object({
  search: z.string().optional(),
  wildcardSearch: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customer: idOrStringSchema.optional(),
  customerId: idOrStringSchema.optional(),
  paymentMethod: z.enum(paymentMethodValues).optional(),
  paymentStatus: z.enum(paymentStatusValues).optional(),
  status: saleLifecycleStatusSchema.optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const saleEntitySchema = createSaleSchema
  .extend({
    _id: objectIdSchema,
    finalAmount: z.number().optional(),
    saleDate: timestampSchema.optional(),
    status: saleLifecycleStatusSchema.optional(),
    items: z.array(saleItemResponseSchema),
    customer: z
      .union([
        idOrStringSchema,
        z
          .object({
            _id: objectIdSchema.optional(),
          })
          .passthrough(),
      ])
      .optional(),
    cashier: z
      .union([
        idOrStringSchema,
        z
          .object({
            _id: objectIdSchema.optional(),
          })
          .passthrough(),
      ])
      .optional(),
    user: z
      .union([
        idOrStringSchema,
        z
          .object({
            _id: objectIdSchema.optional(),
          })
          .passthrough(),
      ])
      .optional(),
    createdBy: idOrStringSchema.optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough();

export type SaleItem = z.infer<typeof saleItemSchema>;
export type SaleItemResponse = z.infer<typeof saleItemResponseSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
export type SaleEntity = z.infer<typeof saleEntitySchema>;
export type PaymentMethod = (typeof paymentMethodValues)[number];
export type PaymentStatus = (typeof paymentStatusValues)[number];
export type SaleLifecycleStatus = (typeof saleLifecycleStatusValues)[number];

export default {
  saleItemSchema,
  saleItemResponseSchema,
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
  saleEntitySchema,
};
