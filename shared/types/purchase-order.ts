/**
 * Purchase order domain types aligned with shared Zod schemas (SSOT)
 */

import type { z } from 'zod';
import {
  purchaseOrderSchema,
  purchaseOrderItemSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderSearchSchema,
  purchaseOrderStatusValues,
  purchaseOrderPaymentStatusValues,
  purchaseOrderTransactionTypeValues,
} from '../schemas/zod/purchaseOrder';
import {
  purchaseOrderSummarySchema,
  purchaseOrderDetailSchema,
} from '../schemas/purchase-orders';

/**
 * Enumerations derived from Zod enums
 */
export type PurchaseOrderStatus = typeof purchaseOrderStatusValues[number];
export type PaymentStatus = typeof purchaseOrderPaymentStatusValues[number];
export type PurchaseOrderTransactionType = typeof purchaseOrderTransactionTypeValues[number];

/**
 * Core entity types
 */
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderSummary = z.infer<typeof purchaseOrderSummarySchema>;
export type PurchaseOrderDetail = z.infer<typeof purchaseOrderDetailSchema>;

/**
 * API request payload types
 */
export type PurchaseOrderRequest = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrderUpdateRequest = z.infer<typeof updatePurchaseOrderSchema>;

/**
 * Query parameters type
 */
export type PurchaseOrderSearchParams = z.infer<typeof purchaseOrderSearchSchema>;

/**
 * Frontend form data model
 */
export interface PurchaseOrderFormData {
  poid: string;
  pobill?: string;
  pobilldate?: Date | string;
  posupplier: string;
  supplier?: string;
  organizationId?: string;
  transactionType?: PurchaseOrderTransactionType;
  selectedAccountIds?: string[];
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  orderDate?: Date | string;
  expectedDeliveryDate?: Date | string;
  actualDeliveryDate?: Date | string;
  items: PurchaseOrderItem[];
  notes?: string;
  status?: PurchaseOrderStatus;
  paymentStatus?: PaymentStatus;
  multiplierMode?: string | number;
}

/**
 * Minimal list item representation
 */
export type PurchaseOrderListItem = Pick<
  PurchaseOrder,
  '_id' | 'poid' | 'orderNumber' | 'pobill' | 'pobilldate' | 'posupplier' | 'totalAmount' | 'status' | 'paymentStatus' | 'createdAt'
>;

/**
 * Type guards leveraging Zod safeParse
 */
export const isPurchaseOrder = (value: unknown): value is PurchaseOrder => {
  return purchaseOrderSchema.safeParse(value).success;
};

export const isPurchaseOrderItem = (value: unknown): value is PurchaseOrderItem => {
  return purchaseOrderItemSchema.safeParse(value).success;
};
