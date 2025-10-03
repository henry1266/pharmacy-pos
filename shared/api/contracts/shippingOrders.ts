import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  shippingOrderEntitySchema,
  shippingOrderSearchSchema,
  shippingOrderIdSchema,
  createShippingOrderSchema,
  updateShippingOrderSchema,
} from '../../schemas/zod/shippingOrder';
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

const shippingOrderResponseSchema = createApiResponseSchema(shippingOrderEntitySchema);
const shippingOrderListResponseSchema = createApiResponseSchema(z.array(shippingOrderEntitySchema));
const shippingOrderDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }));

const recentQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const shippingOrdersContract = c.router({
  listShippingOrders: {
    method: 'GET',
    path: '/shipping-orders',
    responses: {
      200: shippingOrderListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List shipping orders',
      description: 'Retrieve all shipping orders',
      tags: ['ShippingOrders'],
    },
  },
  searchShippingOrders: {
    method: 'GET',
    path: '/shipping-orders/search/query',
    query: shippingOrderSearchSchema.optional(),
    responses: {
      200: shippingOrderListResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Search shipping orders',
      tags: ['ShippingOrders'],
    },
  },
  getShippingOrderById: {
    method: 'GET',
    path: '/shipping-orders/:id',
    pathParams: shippingOrderIdSchema,
    responses: {
      200: shippingOrderResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get shipping order detail',
      tags: ['ShippingOrders'],
    },
  },
  createShippingOrder: {
    method: 'POST',
    path: '/shipping-orders',
    body: createShippingOrderSchema,
    responses: {
      200: shippingOrderResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create shipping order',
      tags: ['ShippingOrders'],
    },
  },
  updateShippingOrder: {
    method: 'PUT',
    path: '/shipping-orders/:id',
    pathParams: shippingOrderIdSchema,
    body: updateShippingOrderSchema,
    responses: {
      200: shippingOrderResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update shipping order',
      tags: ['ShippingOrders'],
    },
  },
  deleteShippingOrder: {
    method: 'DELETE',
    path: '/shipping-orders/:id',
    pathParams: shippingOrderIdSchema,
    responses: {
      200: shippingOrderDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete shipping order',
      tags: ['ShippingOrders'],
    },
  },
  getShippingOrdersBySupplier: {
    method: 'GET',
    path: '/shipping-orders/supplier/:supplierId',
    pathParams: supplierIdParamsSchema,
    responses: {
      200: shippingOrderListResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List shipping orders by supplier',
      tags: ['ShippingOrders'],
    },
  },
  getShippingOrdersByProduct: {
    method: 'GET',
    path: '/shipping-orders/product/:productId',
    pathParams: productIdParamsSchema,
    responses: {
      200: shippingOrderListResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List shipping orders by product',
      tags: ['ShippingOrders'],
    },
  },
  getRecentShippingOrders: {
    method: 'GET',
    path: '/shipping-orders/recent/list',
    query: recentQuerySchema.optional(),
    responses: {
      200: shippingOrderListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List recent shipping orders',
      tags: ['ShippingOrders'],
    },
  },
});

export type ShippingOrdersContract = typeof shippingOrdersContract;

