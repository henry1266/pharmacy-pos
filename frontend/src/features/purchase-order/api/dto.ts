import type { z } from 'zod';
import type { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';

export type PurchaseOrderCreateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/purchaseOrder').createPurchaseOrderSchema
>;

export type PurchaseOrderUpdateRequest = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/purchaseOrder').updatePurchaseOrderSchema
>;

export type PurchaseOrderQueryParams = z.infer<
  typeof import('@pharmacy-pos/shared/dist/schemas/zod/purchaseOrder').purchaseOrderSearchSchema
>;

export type PurchaseOrderResponseDto = PurchaseOrder;
