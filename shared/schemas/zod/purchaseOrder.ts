import { z } from 'zod';
import { API_CONSTANTS, BUSINESS_CONSTANTS } from '../../constants';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .regex(OBJECT_ID_REGEX, { message: 'Must be a valid 24-character hex string.' });

const trimmedString = (field: string, maxLength: number, minLength = 1) =>
  z
    .string()
    .trim()
    .min(minLength, { message: `${field} must contain at least ${minLength} character${minLength > 1 ? 's' : ''}.` })
    .max(maxLength, { message: `${field} must not exceed ${maxLength} characters.` });

const coerceRequiredNumber = (field: string, options: { min?: number; max?: number; positive?: boolean } = {}) => {
  const { min, max, positive } = options;
  let schema = z.coerce.number({ invalid_type_error: `${field} must be a number.` });
  if (positive) {
    schema = schema.gt(0, { message: `${field} must be greater than 0.` });
  }
  if (min !== undefined) {
    schema = schema.min(min, { message: `${field} must be greater than or equal to ${min}.` });
  }
  if (max !== undefined) {
    schema = schema.max(max, { message: `${field} must be less than or equal to ${max}.` });
  }
  return schema;
};

const coerceOptionalNumber = (field: string, options: { min?: number; max?: number; positive?: boolean } = {}) =>
  z
    .union([
      coerceRequiredNumber(field, options),
      z.undefined(),
      z.literal(null),
      z.literal(''),
    ])
    .transform((value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value as number;
    });

const purchaseOrderStatusEnum = z.enum(['pending', 'approved', 'received', 'completed', 'cancelled']);
const paymentStatusEnum = z.enum(['未付', '已付款', '已下收', '已匯款']);
const transactionTypeEnum = z.enum(['進貨', '退貨', '支出']);
const accountingEntryTypeEnum = z.enum(['expense-asset', 'asset-liability']);

const quantityLimits = {
  min: Math.max(0, BUSINESS_CONSTANTS.QUANTITY?.MIN_QUANTITY ?? 0),
  max: BUSINESS_CONSTANTS.QUANTITY?.MAX_QUANTITY ?? 999999,
};

const priceLimits = {
  min: BUSINESS_CONSTANTS.PRICING?.MIN_PRICE ?? 0,
  max: BUSINESS_CONSTANTS.PRICING?.MAX_PRICE ?? 9_999_999.99,
};

export const purchaseOrderItemSchema = z
  .object({
    _id: objectIdSchema.optional(),
    product: objectIdSchema.optional(),
    did: trimmedString('Item code', 64),
    dname: trimmedString('Item name', 200),
    dquantity: coerceRequiredNumber('Quantity', { min: quantityLimits.min, max: quantityLimits.max, positive: true }),
    dtotalCost: coerceRequiredNumber('Total cost', { min: priceLimits.min, max: priceLimits.max }),
    unitPrice: coerceOptionalNumber('Unit price', { min: priceLimits.min, max: priceLimits.max }).optional(),
    receivedQuantity: coerceOptionalNumber('Received quantity', { min: 0, max: quantityLimits.max }).optional(),
    batchNumber: z.string().trim().max(100, { message: 'Batch number must not exceed 100 characters.' }).optional(),
    packageQuantity: coerceOptionalNumber('Package quantity', { min: 0, max: quantityLimits.max }).optional(),
    boxQuantity: coerceOptionalNumber('Box quantity', { min: 0, max: quantityLimits.max }).optional(),
    notes: z.string().trim().max(500, { message: 'Notes must not exceed 500 characters.' }).optional(),
  })
  .strict();

const supplierReferenceSchema = z
  .union([
    objectIdSchema,
    z
      .object({
        _id: objectIdSchema.optional(),
        name: z.string().trim().optional(),
        code: z.string().trim().optional(),
        shortCode: z.string().trim().optional(),
      })
      .passthrough(),
  ])
  .optional();

const userReferenceSchema = z
  .union([
    objectIdSchema,
    z
      .object({
        _id: objectIdSchema.optional(),
        username: z.string().trim().optional(),
        name: z.string().trim().optional(),
      })
      .passthrough(),
  ])
  .optional();

const purchaseOrderCoreSchema = z.object({
  poid: trimmedString('Purchase order code', 64),
  orderNumber: trimmedString('Order number', 64).optional(),
  pobill: z.string().trim().max(100, { message: 'Invoice number must not exceed 100 characters.' }).optional(),
  pobilldate: z.union([z.string(), z.date()]).optional(),
  posupplier: trimmedString('Supplier name', 200),
  supplier: supplierReferenceSchema,
  organizationId: objectIdSchema.optional(),
  transactionType: transactionTypeEnum.optional(),
  selectedAccountIds: z.array(objectIdSchema).optional(),
  accountingEntryType: accountingEntryTypeEnum.optional(),
  orderDate: z.union([z.string(), z.date()]).optional(),
  expectedDeliveryDate: z.union([z.string(), z.date()]).optional(),
  actualDeliveryDate: z.union([z.string(), z.date()]).optional(),
  items: z.array(purchaseOrderItemSchema).min(1, { message: 'At least one purchase item is required.' }),
  totalAmount: coerceOptionalNumber('Total amount', { min: priceLimits.min, max: priceLimits.max }).optional(),
  status: purchaseOrderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  notes: z.string().trim().max(1000, { message: 'Notes must not exceed 1000 characters.' }).optional(),
});

export const createPurchaseOrderSchema = purchaseOrderCoreSchema;
export const updatePurchaseOrderSchema = purchaseOrderCoreSchema.partial();

const purchaseOrderResponseItemSchema = purchaseOrderItemSchema.extend({
  product: z
    .union([
      objectIdSchema,
      z
        .object({
          _id: objectIdSchema.optional(),
          name: z.string().trim().optional(),
          code: z.string().trim().optional(),
        })
        .passthrough(),
    ])
    .optional(),
});

export const purchaseOrderSchema = z.object({
  _id: objectIdSchema,
  poid: trimmedString('Purchase order code', 64),
  orderNumber: trimmedString('Order number', 64),
  pobill: z.string().trim().max(100, { message: 'Invoice number must not exceed 100 characters.' }).optional(),
  pobilldate: z.union([z.string(), z.date()]).optional(),
  posupplier: trimmedString('Supplier name', 200),
  supplier: supplierReferenceSchema,
  organizationId: objectIdSchema.optional(),
  transactionType: transactionTypeEnum.optional(),
  selectedAccountIds: z.array(objectIdSchema).optional(),
  accountingEntryType: accountingEntryTypeEnum.optional(),
  orderDate: z.union([z.string(), z.date()]).optional(),
  expectedDeliveryDate: z.union([z.string(), z.date()]).optional(),
  actualDeliveryDate: z.union([z.string(), z.date()]).optional(),
  items: z.array(purchaseOrderResponseItemSchema),
  totalAmount: z.number().min(priceLimits.min, { message: 'Total amount must be greater than or equal to 0.' }),
  status: purchaseOrderStatusEnum,
  paymentStatus: paymentStatusEnum.optional(),
  notes: z.string().trim().max(1000, { message: 'Notes must not exceed 1000 characters.' }).optional(),
  createdBy: userReferenceSchema,
  relatedTransactionGroupId: objectIdSchema.optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const purchaseOrderSearchSchema = z.object({
  poid: trimmedString('Purchase order code', 64).optional(),
  pobill: trimmedString('Invoice number', 100).optional(),
  posupplier: trimmedString('Supplier name', 200).optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  status: purchaseOrderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  page: z.coerce.number({ invalid_type_error: 'Page must be a number.' }).int().min(1).optional(),
  limit: z
    .coerce.number({ invalid_type_error: 'Limit must be a number.' })
    .int()
    .min(1)
    .max(API_CONSTANTS.PAGINATION?.MAX_LIMIT ?? 100)
    .optional(),
  sortBy: z.string().trim().max(50, { message: 'Sort by must not exceed 50 characters.' }).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const purchaseOrderIdSchema = z.object({
  id: objectIdSchema,
});

export const purchaseOrderStatusValues = purchaseOrderStatusEnum.options;
export const purchaseOrderPaymentStatusValues = paymentStatusEnum.options;
export const purchaseOrderTransactionTypeValues = transactionTypeEnum.options;
export const purchaseOrderEntitySchema = purchaseOrderSchema;
export default {
  purchaseOrderSchema,
  purchaseOrderEntitySchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderItemSchema,
  purchaseOrderSearchSchema,
  purchaseOrderIdSchema,
  purchaseOrderStatusValues,
  purchaseOrderPaymentStatusValues,
  purchaseOrderTransactionTypeValues,
};



