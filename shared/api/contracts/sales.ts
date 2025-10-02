import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createSaleSchema,
  saleEntitySchema,
  saleQuerySchema,
  updateSaleSchema,
} from '../../schemas/zod/sale';
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const saleIdParamsSchema = z.object({
  id: zodId,
});

const saleResponseSchema = createApiResponseSchema(saleEntitySchema);
const saleListResponseSchema = createApiResponseSchema(z.array(saleEntitySchema));
const saleDeleteResponseSchema = createApiResponseSchema(
  z.object({
    id: zodId,
  }),
);

export const salesContract = c.router({
  listSales: {
    method: 'GET',
    path: '/sales',
    query: saleQuerySchema.optional(),
    responses: {
      200: saleListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List sales',
      description: 'Retrieve sales with optional search filters',
      tags: ['Sales'],
    },
  },
  getTodaySales: {
    method: 'GET',
    path: '/sales/today',
    responses: {
      200: saleListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: "Today's sales",
      description: 'Return sales created on the current day',
      tags: ['Sales'],
    },
  },
  getSaleById: {
    method: 'GET',
    path: '/sales/:id',
    pathParams: saleIdParamsSchema,
    responses: {
      200: saleResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get sale detail',
      tags: ['Sales'],
    },
  },
  createSale: {
    method: 'POST',
    path: '/sales',
    body: createSaleSchema,
    responses: {
      200: saleResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create sale',
      tags: ['Sales'],
    },
  },
  updateSale: {
    method: 'PUT',
    path: '/sales/:id',
    pathParams: saleIdParamsSchema,
    body: updateSaleSchema,
    responses: {
      200: saleResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update sale',
      tags: ['Sales'],
    },
  },
  deleteSale: {
    method: 'DELETE',
    path: '/sales/:id',
    pathParams: saleIdParamsSchema,
    responses: {
      200: saleDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete sale',
      tags: ['Sales'],
    },
  },
});

export type SalesContract = typeof salesContract;
