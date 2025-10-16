import type { z } from 'zod';
import type {
  PurchaseOrderSummary,
  PurchaseOrderDetail,
} from '@pharmacy-pos/shared/types/purchase-order';

export type PurchaseOrderCreateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/purchaseOrder').createPurchaseOrderSchema
>;

export type PurchaseOrderUpdateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/purchaseOrder').updatePurchaseOrderSchema
>;

export type PurchaseOrderQueryParams = z.infer<
  typeof import('@pharmacy-pos/shared/schemas/zod/purchaseOrder').purchaseOrderSearchSchema
>;

export type PurchaseOrderListItemDto = PurchaseOrderSummary;
export type PurchaseOrderDetailDto = PurchaseOrderDetail;
