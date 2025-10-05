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

const shippingOrderStatusEnum = z.enum(['pending', 'completed', 'cancelled']);
const shippingOrderPaymentStatusEnum = z.enum(['\u672a\u6536', '\u5df2\u6536\u6b3e', '\u5df2\u958b\u7acb']);

const quantityLimits = {
  min: Math.max(0, BUSINESS_CONSTANTS?.QUANTITY?.MIN_QUANTITY ?? 0),
  max: BUSINESS_CONSTANTS?.QUANTITY?.MAX_QUANTITY ?? 999999,
};

const priceLimits = {
  min: BUSINESS_CONSTANTS?.PRICING?.MIN_PRICE ?? 0,
  max: BUSINESS_CONSTANTS?.PRICING?.MAX_PRICE ?? 9_999_999.99,
};

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

const customerReferenceSchema = z
  .union([
    objectIdSchema,
    z
      .object({
        _id: objectIdSchema.optional(),
        name: z.string().trim().optional(),
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

const shippingOrderItemSchema = z
  .object({
    _id: objectIdSchema.optional(),
    product: objectIdSchema.optional(),
    did: trimmedString('Item code', 64),
    dname: trimmedString('Item name', 200),
    dquantity: coerceRequiredNumber('Quantity', { min: quantityLimits.min, max: quantityLimits.max, positive: true }),
    dtotalCost: coerceRequiredNumber('Total cost', { min: priceLimits.min, max: priceLimits.max }),
    unitPrice: coerceOptionalNumber('Unit price', { min: priceLimits.min, max: priceLimits.max }).optional(),
    healthInsuranceCode: z.string().trim().max(100).optional(),
    batchNumber: z.string().trim().max(100).optional(),
    packageQuantity: coerceOptionalNumber('Package quantity', { min: 0, max: quantityLimits.max }).optional(),
    boxQuantity: coerceOptionalNumber('Box quantity', { min: 0, max: quantityLimits.max }).optional(),
    unit: z.string().trim().max(50).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

const shippingOrderResponseItemSchema = shippingOrderItemSchema.extend({
  product: z
    .union([
      objectIdSchema,
      z
        .object({
          _id: objectIdSchema.optional(),
          name: z.string().trim().optional(),
          code: z.string().trim().optional(),
          healthInsuranceCode: z.string().trim().optional(),
        })
        .passthrough(),
    ])
    .optional(),
});

const shippingOrderCoreSchema = z.object({
  sosupplier: trimmedString('Supplier name', 200),
  supplier: supplierReferenceSchema,
  customer: customerReferenceSchema,
  customerName: z.string().trim().max(200).optional(),
  orderDate: z.union([z.string(), z.date()]).optional(),
  shippingDate: z.union([z.string(), z.date()]).optional(),
  deliveryDate: z.union([z.string(), z.date()]).optional(),
  items: z.array(shippingOrderItemSchema).min(1, { message: 'At least one shipping item is required.' }),
  totalAmount: coerceOptionalNumber('Total amount', { min: priceLimits.min, max: priceLimits.max }).optional(),
  status: shippingOrderStatusEnum.optional(),
  paymentStatus: shippingOrderPaymentStatusEnum.optional(),
  shippingAddress: z.string().trim().max(300).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createShippingOrderSchema = shippingOrderCoreSchema.extend({
  soid: trimmedString('Shipping order code', 64).optional(),
  orderNumber: trimmedString('Order number', 64).optional(),
});

export const updateShippingOrderSchema = createShippingOrderSchema.partial();

export const shippingOrderSchema = z.object({
  _id: objectIdSchema,
  soid: trimmedString('Shipping order code', 64),
  orderNumber: trimmedString('Order number', 64),
  sosupplier: trimmedString('Supplier name', 200),
  supplier: supplierReferenceSchema,
  customer: customerReferenceSchema,
  customerName: z.string().trim().max(200).optional(),
  items: z.array(shippingOrderResponseItemSchema),
  totalAmount: z.number().min(priceLimits.min, { message: 'Total amount must be greater than or equal to 0.' }),
  status: shippingOrderStatusEnum,
  paymentStatus: shippingOrderPaymentStatusEnum.optional(),
  orderDate: z.union([z.string(), z.date()]).optional(),
  shippingDate: z.union([z.string(), z.date()]).optional(),
  deliveryDate: z.union([z.string(), z.date()]).optional(),
  shippingAddress: z.string().trim().max(300).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  createdBy: userReferenceSchema,
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const shippingOrderSearchSchema = z.object({
  soid: trimmedString('Shipping order code', 64).optional(),
  sosupplier: trimmedString('Supplier name', 200).optional(),
  status: shippingOrderStatusEnum.optional(),
  paymentStatus: shippingOrderPaymentStatusEnum.optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
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

export const shippingOrderIdSchema = z.object({
  id: objectIdSchema,
});

export const shippingOrderStatusValues = shippingOrderStatusEnum.options;
export const shippingOrderPaymentStatusValues = shippingOrderPaymentStatusEnum.options;
export const shippingOrderItemSchemaDefinition = shippingOrderItemSchema;
export const shippingOrderEntitySchema = shippingOrderSchema;

export default {
  shippingOrderSchema,
  shippingOrderEntitySchema,
  shippingOrderItemSchema: shippingOrderItemSchemaDefinition,
  shippingOrderStatusValues,
  shippingOrderPaymentStatusValues,
  createShippingOrderSchema,
  updateShippingOrderSchema,
  shippingOrderSearchSchema,
  shippingOrderIdSchema,
};


