import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderEntitySchema,
  purchaseOrderSearchSchema,
  purchaseOrderIdSchema,
} from '../../schemas/zod/purchaseOrder';
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const supplierIdParamsSchema = z.object({
  supplierId: zodId,
});

const productIdParamsSchema = z.object({
  productId: zodId,
});

const purchaseOrderResponseSchema = createApiResponseSchema(purchaseOrderEntitySchema);
const purchaseOrderListResponseSchema = createApiResponseSchema(z.array(purchaseOrderEntitySchema));
const purchaseOrderDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }));

const recentQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const purchaseOrdersContract = c.router({
  listPurchaseOrders: {
    method: 'GET',
    path: '/purchase-orders',
    query: purchaseOrderSearchSchema.optional(),
    responses: {
      200: purchaseOrderListResponseSchema,
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
      200: purchaseOrderResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get purchase order detail',
      tags: ['PurchaseOrders'],
    },
  },
  createPurchaseOrder: {
    method: 'POST',
    path: '/purchase-orders',
    body: createPurchaseOrderSchema,
    responses: {
      200: purchaseOrderResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create purchase order',
      tags: ['PurchaseOrders'],
    },
  },
  updatePurchaseOrder: {
    method: 'PUT',
    path: '/purchase-orders/:id',
    pathParams: purchaseOrderIdSchema,
    body: updatePurchaseOrderSchema,
    responses: {
      200: purchaseOrderResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update purchase order',
      tags: ['PurchaseOrders'],
    },
  },
  deletePurchaseOrder: {
    method: 'DELETE',
    path: '/purchase-orders/:id',
    pathParams: purchaseOrderIdSchema,
    responses: {
      200: purchaseOrderDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete purchase order',
      tags: ['PurchaseOrders'],
    },
  },
  getPurchaseOrdersBySupplier: {
    method: 'GET',
    path: '/purchase-orders/supplier/:supplierId',
    pathParams: supplierIdParamsSchema,
    responses: {
      200: purchaseOrderListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List purchase orders by supplier',
      tags: ['PurchaseOrders'],
    },
  },
  getPurchaseOrdersByProduct: {
    method: 'GET',
    path: '/purchase-orders/product/:productId',
    pathParams: productIdParamsSchema,
    responses: {
      200: purchaseOrderListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List purchase orders by product',
      tags: ['PurchaseOrders'],
    },
  },
  getRecentPurchaseOrders: {
    method: 'GET',
    path: '/purchase-orders/recent/list',
    query: recentQuerySchema.optional(),
    responses: {
      200: purchaseOrderListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List recent purchase orders',
      tags: ['PurchaseOrders'],
    },
  },
});

export type PurchaseOrdersContract = typeof purchaseOrdersContract;
