import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema,
  supplierEntitySchema,
} from '../../schemas/zod/supplier';
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const supplierIdParamsSchema = z.object({
  id: zodId,
});

const supplierResponseSchema = createApiResponseSchema(supplierEntitySchema);
const supplierListResponseSchema = createApiResponseSchema(z.array(supplierEntitySchema));
const supplierDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }));

export const suppliersContract = c.router({
  listSuppliers: {
    method: 'GET',
    path: '/suppliers',
    query: supplierSearchSchema.optional(),
    responses: {
      200: supplierListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List suppliers',
      description: 'Retrieve suppliers with optional filters',
      tags: ['Suppliers'],
    },
  },
  getSupplierById: {
    method: 'GET',
    path: '/suppliers/:id',
    pathParams: supplierIdParamsSchema,
    responses: {
      200: supplierResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get supplier detail',
      tags: ['Suppliers'],
    },
  },
  createSupplier: {
    method: 'POST',
    path: '/suppliers',
    body: createSupplierSchema,
    responses: {
      200: supplierResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create supplier',
      tags: ['Suppliers'],
    },
  },
  updateSupplier: {
    method: 'PUT',
    path: '/suppliers/:id',
    pathParams: supplierIdParamsSchema,
    body: updateSupplierSchema,
    responses: {
      200: supplierResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update supplier',
      tags: ['Suppliers'],
    },
  },
  deleteSupplier: {
    method: 'DELETE',
    path: '/suppliers/:id',
    pathParams: supplierIdParamsSchema,
    responses: {
      200: supplierDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete supplier',
      tags: ['Suppliers'],
    },
  },
});

export type SuppliersContract = typeof suppliersContract;
