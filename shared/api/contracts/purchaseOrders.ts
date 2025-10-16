import { initContract } from '@ts-rest/core';

import {
  purchaseOrderSearchSchema,
  purchaseOrderIdSchema,
} from '../../schemas/zod/purchaseOrder';
import {
  purchaseOrderFilteredListResponseSchema,
  purchaseOrderMutationResponseSchema,
  purchaseOrderCreateInputSchema,
  purchaseOrderUpdateInputSchema,
  purchaseOrderDeleteResponseSchema,
  purchaseOrderErrorSchema,
  purchaseOrderRecentQueryFilterSchema,
  purchaseOrderSupplierFilterSchema,
  purchaseOrderProductFilterSchema,
} from '../../schemas/purchase-orders';

const c = initContract();

export const purchaseOrdersContract = c.router({
  listPurchaseOrders: {
    method: 'GET',
    path: '/purchase-orders',
    query: purchaseOrderSearchSchema.optional(),
    responses: {
      200: purchaseOrderFilteredListResponseSchema,
      400: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'List purchase orders',
      description: 'Retrieve purchase orders with optional filters',
      tags: ['PurchaseOrders'],
    },
  },
  listRecentPurchaseOrders: {
    method: 'GET',
    path: '/purchase-orders/recent',
    query: purchaseOrderRecentQueryFilterSchema.optional(),
    responses: {
      200: purchaseOrderFilteredListResponseSchema,
      400: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'List recent purchase orders',
      description: 'Retrieve the most recently created purchase orders',
      tags: ['PurchaseOrders'],
    },
  },
  listPurchaseOrdersBySupplier: {
    method: 'GET',
    path: '/purchase-orders/supplier/:supplierId',
    pathParams: purchaseOrderSupplierFilterSchema,
    responses: {
      200: purchaseOrderFilteredListResponseSchema,
      400: purchaseOrderErrorSchema,
      404: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'List purchase orders for a supplier',
      description: 'Retrieve purchase orders linked to a specific supplier',
      tags: ['PurchaseOrders'],
    },
  },
  listPurchaseOrdersByProduct: {
    method: 'GET',
    path: '/purchase-orders/product/:productId',
    pathParams: purchaseOrderProductFilterSchema,
    responses: {
      200: purchaseOrderFilteredListResponseSchema,
      400: purchaseOrderErrorSchema,
      404: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'List purchase orders for a product',
      description: 'Retrieve completed purchase orders that include the specified product',
      tags: ['PurchaseOrders'],
    },
  },
  getPurchaseOrderById: {
    method: 'GET',
    path: '/purchase-orders/:id',
    pathParams: purchaseOrderIdSchema,
    responses: {
      200: purchaseOrderMutationResponseSchema,
      404: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'Get purchase order detail',
      tags: ['PurchaseOrders'],
    },
  },
  createPurchaseOrder: {
    method: 'POST',
    path: '/purchase-orders',
    body: purchaseOrderCreateInputSchema,
    responses: {
      200: purchaseOrderMutationResponseSchema,
      400: purchaseOrderErrorSchema,
      401: purchaseOrderErrorSchema,
      403: purchaseOrderErrorSchema,
      409: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'Create purchase order',
      description: 'Create a new purchase order using the shared create schema',
      tags: ['PurchaseOrders'],
    },
  },
  updatePurchaseOrder: {
    method: 'PUT',
    path: '/purchase-orders/:id',
    pathParams: purchaseOrderIdSchema,
    body: purchaseOrderUpdateInputSchema,
    responses: {
      200: purchaseOrderMutationResponseSchema,
      400: purchaseOrderErrorSchema,
      401: purchaseOrderErrorSchema,
      403: purchaseOrderErrorSchema,
      404: purchaseOrderErrorSchema,
      409: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
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
      400: purchaseOrderErrorSchema,
      404: purchaseOrderErrorSchema,
      409: purchaseOrderErrorSchema,
      500: purchaseOrderErrorSchema,
    },
    metadata: {
      summary: 'Delete purchase order',
      tags: ['PurchaseOrders'],
    },
  },
});

export type PurchaseOrdersContract = typeof purchaseOrdersContract;
