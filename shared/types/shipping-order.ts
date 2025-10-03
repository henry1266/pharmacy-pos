/**
 * Shipping order domain types aligned with shared Zod schemas (SSOT)
 */

import type { z } from 'zod';
import {
  shippingOrderSchema,
  shippingOrderItemSchemaDefinition,
  createShippingOrderSchema,
  updateShippingOrderSchema,
  shippingOrderSearchSchema,
  shippingOrderStatusValues,
  shippingOrderPaymentStatusValues,
} from '../schemas/zod/shippingOrder';

export type ShippingOrderStatus = typeof shippingOrderStatusValues[number];
export type ShippingOrderPaymentStatus = typeof shippingOrderPaymentStatusValues[number];

export type ShippingOrderItem = z.infer<typeof shippingOrderItemSchemaDefinition>;
export type ShippingOrder = z.infer<typeof shippingOrderSchema>;

export type ShippingOrderCreateRequest = z.infer<typeof createShippingOrderSchema>;
export type ShippingOrderUpdateRequest = z.infer<typeof updateShippingOrderSchema>;

export type ShippingOrderSearchParams = z.infer<typeof shippingOrderSearchSchema>;

export const isShippingOrder = (value: unknown): value is ShippingOrder => {
  return shippingOrderSchema.safeParse(value).success;
};

export const isShippingOrderItem = (value: unknown): value is ShippingOrderItem => {
  return shippingOrderItemSchemaDefinition.safeParse(value).success;
};
