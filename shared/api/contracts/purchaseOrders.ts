import { initContract } from '@ts-rest/core';
import {
  purchaseOrderSearchSchema,
  purchaseOrderIdSchema,
} from '../../schemas/zod/purchaseOrder';
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common';
import {
  purchaseOrderSummaryListSchema,
  purchaseOrderDetailSchema,
} from '../../schemas/purchase-orders';

const c = initContract();

const purchaseOrderSummaryResponseSchema = createApiResponseSchema(purchaseOrderSummaryListSchema);
const purchaseOrderDetailResponseSchema = createApiResponseSchema(purchaseOrderDetailSchema);

export const purchaseOrdersContract = c.router({
  listPurchaseOrders: {
    method: 'GET',
    path: '/purchase-orders',
    query: purchaseOrderSearchSchema.optional(),
    responses: {
      200: purchaseOrderSummaryResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List purchase orders',
      description: 'Retrieve purchase orders with optional filters',
      tags: ['PurchaseOrders'],
    },
  },
  getPurchaseOrderById: {
    method: 'GET',
    path: '/purchase-orders/:id',
    pathParams: purchaseOrderIdSchema,
    responses: {
      200: purchaseOrderDetailResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get purchase order detail',
      tags: ['PurchaseOrders'],
    },
  },
});

export type PurchaseOrdersContract = typeof purchaseOrdersContract;
